"""tests for backend fastapi code"""
import os
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from backend.app.security import get_current_active_user
from datetime import datetime, timedelta, timezone


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
    mock_db_instance.points.update_one.return_value = MagicMock(
        modified_count=1)
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
    mock_db_instance.points.find_one.assert_called_once_with({"id": "0"}, {
                                                             "_id": 0})


@patch('backend.app.api.db')
def test_update_points_decrease(mock_db_instance):
    """Test updating points with negative change"""
    # Mock database response
    mock_db_instance.points.update_one.return_value = MagicMock(
        modified_count=1)
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
    mock_db_instance.client.server_info.side_effect = Exception(
        "Connection timeout")

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


@patch('backend.app.api.db')
def test_login_user_doesnt_exist(mock_db_instance):
    """Test login attempt with non-existing user"""

    mock_db_instance.users.find_one.return_value = None

    response = client.post("/login", json={"email": "test@example.com", "password": "password"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})


@patch('backend.app.api.verify_password')
@patch('backend.app.api.db')
def test_login_wrong_password_or_email(mock_db_instance, mock_verify_password):
    """Test login attempt with incorrect credentials"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "admin",
        "pending": False
        }
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc),
        "expirationTime": datetime.now(timezone.utc) + timedelta(days=1),
        "activationTime": None,
        "isUsed": False,
        "usedByUser": None
        }
    
    mock_verify_password.return_value = False

    response = client.post(
        "/login",
        json={"email": "test@example.com", "password": "password123"}
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})
    

@patch('backend.app.api.create_access_token')
@patch('backend.app.api.verify_password')
@patch('backend.app.api.db')
def test_login_successful_login_attempt(mock_db_instance, mock_verify_password, mock_create_access_token):
    """Test successful login attempt"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "admin",
        "pending": False
        }
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc),
        "expirationTime": datetime.now(timezone.utc) + timedelta(days=1),
        "activationTime": datetime.now(timezone.utc) - timedelta(days=1),
        "isUsed": True,
        "usedByUser": "test@example.com"
        }
    
    mock_verify_password.return_value = True

    mock_create_access_token.return_value = "mock_access_token"

    response = client.post(
        "/login",
        json={"email": "test@example.com", "password": "password123"}
        )

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "mock_access_token",
        "user": {"email": "test@example.com", "role": "admin"}
        }

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})


@patch('backend.app.api.db')
def test_register_email_already_in_use(mock_db_instance):
    """Test register attempt with already existing email"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "admin",
        "pending": False
        }
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc),
        "expirationTime": datetime.now(timezone.utc) + timedelta(days=1),
        "activationTime": None,
        "isUsed": False,
        "usedByUser": None
        }
    
    response = client.post(
        "/register",
        json={"email": "test@example.com", "password": "password123", "code": "valid_code"}
        )
    
    assert response.status_code == 401
    assert response.json() == {"detail": "Email already in use"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})


@patch('backend.app.api.db')
def test_register_invalid_email(mock_db_instance):
    """Test register attempt with invalid email"""

    mock_db_instance.users.find_one.return_value = None
    
    response = client.post(
        "/register",
        json={"email": "test.example.com", "password": "password123", "code": "valid_code"}
        )

    assert response.status_code == 422
    assert response.json()['detail'][0]['msg'] == "value is not a valid email address: An email address must have an @-sign."


@patch('backend.app.api.get_password_hash')
@patch('backend.app.api.db')
def test_register_successful_register_attempt(mock_db_instance, mock_get_password_hash):
    """Test registering successfully"""

    mock_db_instance.users.find_one.return_value = None

    mock_db_instance.users.update_one.return_value = MagicMock(upserted_id="123")

    mock_get_password_hash.return_value = "mock_password_hash"
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc),
        "expirationTime": datetime.now(timezone.utc) + timedelta(days=1),
        "activationTime": None,
        "isUsed": False,
        "usedByUser": None
        }
    
    response = client.post(
        "/register",
        json={"email": "test@example.com", "password": "password123", "code": "valid_code"}
        )
    
    assert response.status_code == 200

    mock_db_instance.users.update_one.assert_called_once_with(
        {"email": "test@example.com"},
        {
        "$set": {
            "email": "test@example.com",
            "password": "mock_password_hash",
            "role": "gamemaster"
            }
        },
        upsert = True
    )


def test_read_current_user():
    """Test checking the logged in user"""
    mock_user = {"email": "test@example.com", "role": "admin"}

    def override_get_user():
        return mock_user

    app.dependency_overrides[get_current_active_user] = override_get_user

    response = client.get("/users/me")

    assert response.status_code == 200
    assert response.json() == mock_user

    app.dependency_overrides = {}

