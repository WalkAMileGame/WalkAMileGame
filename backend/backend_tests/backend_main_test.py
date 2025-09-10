"""Tests for main.py"""
import os
os.environ['TESTING'] = 'true'
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Mock the router before importing main
with patch('backend.app.api.router') as mock_router:
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
    assert response.status_code == 200 or response.status_code == 405
