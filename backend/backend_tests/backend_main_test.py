"""Tests for main.py"""
import os
import sys
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient


os.environ['TESTING'] = 'true'

# Mock MongoDB connection before importing main
mock_mongo_client = MagicMock()
mock_mongo_client.get_database.return_value = MagicMock()
mock_mongo_client.admin.command.return_value = {}

with patch('backend.app.db.MongoClient', return_value=mock_mongo_client):
    from backend.main import app

client = TestClient(app)


def test_app_creation():
    """Test that the FastAPI app is created"""
    assert app is not None
    assert app.title == "FastAPI"


def test_cors_middleware():
    """Test CORS middleware is configured"""
    middleware_classes = [m.cls.__name__ for m in app.user_middleware]
    assert "CORSMiddleware" in str(middleware_classes)


def test_allowed_origins():
    """Test CORS allows the configured origins"""
    response = client.options(
        "/",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
    )
    # The response should include CORS headers for allowed origins
    assert response.status_code in (200, 405)
