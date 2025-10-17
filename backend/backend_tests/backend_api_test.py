"""tests for backend fastapi code"""
import os
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI


os.environ['TESTING'] = 'true'

# Create a test app
app = FastAPI()

# Mock the database before importing router
with patch("backend.app.api.db") as mock_db:
    from backend.app.api import router
    app.include_router(router)

client = TestClient(app)


def test_read_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to your todo list."}


@patch('backend.app.api.db')
def test_get_items(mock_db_instance):
    """Test getting items from database"""
    # Mock database response
    mock_db_instance.list_collection_names.return_value = ["points"]
    mock_db_instance.points.find.return_value = [
        {"id": "0", "values": 100}
    ]

    response = client.get("/items")
    assert response.status_code == 200
    assert response.json() == {"id": "0", "values": 100}

    # Verify database methods were called
    mock_db_instance.points.find.assert_called_once_with({}, {"_id": 0})


@patch('backend.app.api.db')
def test_update_points_increase(mock_db_instance):
    """Test updating points with positive change"""
    # Mock database response
    mock_db_instance.points.update_one.return_value = MagicMock(modified_count=1)
    mock_db_instance.points.find_one.return_value = {"id": "0", "values": 150}

    response = client.put("/items", json={"change": 50})
    assert response.status_code == 200
    assert response.json() == {"id": "0", "values": 150}

    # Verify database methods were called correctly
    mock_db_instance.points.update_one.assert_called_once_with(
        {"id": "0"},
        {"$inc": {"values": 50}},
        upsert=True
    )
    mock_db_instance.points.find_one.assert_called_once_with({"id": "0"}, {"_id": 0})


@patch('backend.app.api.db')
def test_update_points_decrease(mock_db_instance):
    """Test updating points with negative change"""
    # Mock database response
    mock_db_instance.points.update_one.return_value = MagicMock(modified_count=1)
    mock_db_instance.points.find_one.return_value = {"id": "0", "values": 50}

    response = client.put("/items", json={"change": -50})
    assert response.status_code == 200
    assert response.json() == {"id": "0", "values": 50}

    # Verify the decrease was applied
    mock_db_instance.points.update_one.assert_called_once_with(
        {"id": "0"},
        {"$inc": {"values": -50}},
        upsert=True
    )


def test_update_points_invalid_data():
    """Test updating points with invalid data"""
    response = client.put("/items", json={"wrong_field": "value"})
    assert response.status_code == 422  # Validation error


def test_update_points_no_body():
    """Test updating points without request body"""
    response = client.put("/items")
    assert response.status_code == 422  # Validation error

@patch('backend.app.api.db')
def test_health_check_healthy(mock_db_instance):
    """Test health check when database connection is healthy"""
    # Mock successful database connection
    mock_db_instance.client.server_info.return_value = {"version": "5.0.0"}

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "message": "Backend server is running"
    }

    # Verify server_info was called
    mock_db_instance.client.server_info.assert_called_once()


@patch('backend.app.api.db')
def test_health_check_unhealthy(mock_db_instance):
    """Test health check when database connection fails"""
    # Mock database connection failure
    mock_db_instance.client.server_info.side_effect = Exception("Connection timeout")

    response = client.get("/health")
    assert response.status_code == 200  # Endpoint still returns 200
    
    response_data = response.json()
    assert response_data["status"] == "unhealthy"
    assert "Database connection failed" in response_data["message"]
    assert "Connection timeout" in response_data["message"]

    # Verify server_info was called
    mock_db_instance.client.server_info.assert_called_once()


@patch('backend.app.api.db')
def test_health_check_various_db_errors(mock_db_instance):
    """Test health check with different database error types"""
    # Test with different error messages
    test_errors = [
        "Authentication failed",
        "Network unreachable",
        "Database does not exist"
    ]

    for error_msg in test_errors:
        mock_db_instance.client.server_info.side_effect = Exception(error_msg)

        response = client.get("/health")
        assert response.status_code == 200

        response_data = response.json()
        assert response_data["status"] == "unhealthy"
        assert error_msg in response_data["message"]
