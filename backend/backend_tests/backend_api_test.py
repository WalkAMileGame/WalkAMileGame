"""tests for backend fastapi code"""
import os
import sys
from unittest.mock import patch, MagicMock, Mock
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from backend.app.models import AccessCode

os.environ['TESTING'] = 'true'

# Mock MongoDB connection before importing db module
mock_mongo_client = MagicMock()
mock_mongo_client.get_database.return_value = MagicMock()
mock_mongo_client.admin.command.return_value = {}

with patch('backend.app.db.MongoClient', return_value=mock_mongo_client):
    from backend.app.security import get_current_active_user
    from backend.app.api import router

# Create a test app
app = FastAPI()
app.include_router(router)

client = TestClient(app)

def mock_get_current_active_user():
    return {
        "email": "admin@test.com", 
        "role": "admin",
    }

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_active_user] = mock_get_current_active_user
    yield
    app.dependency_overrides = {}


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
def test_login_un_activated_user(mock_db_instance):
    """Test login attempt when no active access code for user"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "admin",
        }
    
    mock_db_instance.codes.find_one.return_value = None

    response = client.post(
        "/login",
        json={"email": "test@example.com", "password": "password123"}
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Account hasn't been activated"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})
    mock_db_instance.codes.find_one.assert_called_once_with({"usedByUser": "test@example.com"})

@patch('backend.app.api.is_code_expired')
@patch('backend.app.api.db')
def test_login_expired_code(mock_db_instance, mock_is_code_expired):
    """Test login attempt when no active access code for user"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "admin",
        }
    
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc) - relativedelta(months=7),
        "expirationTime": datetime.now(timezone.utc) - relativedelta(months=1),
        "activationTime": datetime.now(timezone.utc) - relativedelta(months=2),
        "isUsed": True,
        "usedByUser": "test@example.com"
        }

    response = client.post(
        "/login",
        json={"email": "test@example.com", "password": "password123"}
        )

    assert response.status_code == 403
    assert response.json() == {"detail": "ACCOUNT_EXPIRED"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})
    mock_db_instance.codes.find_one.assert_called_once_with({"usedByUser": "test@example.com"})


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
def test_register_incorrect_activation_code(mock_db_instance):
    """Test register attempt with already existing email"""

    mock_db_instance.users.find_one.return_value = None
    mock_db_instance.codes.find_one.return_value = None
    
    response = client.post(
        "/register",
        json={"email": "test@testly.com", "password": "password123", "code": "invalid_code"}
        )
    
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect activation code"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@testly.com"})
    mock_db_instance.codes.find_one.assert_called_once_with({"code": "invalid_code"})


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


@patch('backend.app.api.verify_password')
@patch('backend.app.api.db')
def test_renew_access_code_wrong_user(mock_db_instance, mock_verify_password):
    """Test renewing access code with wrong user"""

    mock_db_instance.users.find_one.return_value = None

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
        "/renew-access",
        json={"email": "mistyped@emil.com", "password": "password123", "new_code": "valid_code"}
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "mistyped@emil.com"})


@patch('backend.app.api.activate_code')
@patch('backend.app.api.verify_password')
@patch('backend.app.api.db')
def test_renew_access_code_invalid_code(mock_db_instance, mock_verify_password, mock_activate_code):
    """Test renewing access code with invalid code"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "gamemaster",
        }

    mock_db_instance.codes.find_one.return_value = None

    mock_verify_password.return_value = True

    mock_activate_code.return_value = AccessCode(
        code = "valid_code",
        creationTime = datetime.now(timezone.utc) - timedelta(days=1),
        expirationTime = datetime.now(timezone.utc) + timedelta(days=1),
        activationTime = datetime.now(timezone.utc),
        isUsed = True,
        usedByUser = "test@example.com"
    )

    response = client.post(
        "/renew-access",
        json={"email": "test@example.com", "password": "password123", "new_code": "invalid_code"}
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or used code"}

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})


@patch('backend.app.api.activate_code')
@patch('backend.app.api.verify_password')
@patch('backend.app.api.db')
def test_renew_access_code_successfully(mock_db_instance, mock_verify_password, mock_activate_code):
    """Test renewing access code successfully"""

    mock_db_instance.users.find_one.return_value = {
        "_id": "mock_id",
        "email": "test@example.com",
        "password": "mock_hashed_password",
        "role": "gamemaster",
        }
    
    mock_db_instance.codes.find_one.return_value = {
        "code": "valid_code",
        "creationTime": datetime.now(timezone.utc),
        "expirationTime": datetime.now(timezone.utc) + timedelta(days=1),
        "activationTime": None,
        "isUsed": False,
        "usedByUser": None
        }
    
    mock_verify_password.return_value = True

    expected_access_code = AccessCode(
        code = "valid_code",
        creationTime = datetime.now(timezone.utc) - timedelta(days=1),
        expirationTime = datetime.now(timezone.utc) + timedelta(days=1),
        activationTime = datetime.now(timezone.utc),
        isUsed = True,
        usedByUser = "test@example.com"
    )

    mock_activate_code.return_value = expected_access_code

    mock_db_instance.codes.update_one.return_value = MagicMock(upserted_id="123")

    response = client.post(
        "/renew-access",
        json={"email": "test@example.com", "password": "password123", "new_code": "valid_code"}
        )
    
    assert response.status_code == 200

    mock_db_instance.users.find_one.assert_called_once_with({"email": "test@example.com"})

    mock_db_instance.codes.update_one.assert_called_once_with(
        {"code": "valid_code"},
        {"$set": expected_access_code.model_dump()}
    )


@patch('backend.app.api.generate_new_access_code')
@patch('backend.app.api.db')
def test_generate_new_access_code(mock_db_instance, mock_generate_new_access_code):
    """Test generating new access code"""

    expected_access_code = AccessCode(
        code = "valid_code",
        creationTime = datetime.now(timezone.utc) - timedelta(days=1),
        expirationTime = datetime.now(timezone.utc) + timedelta(days=1),
    )

    mock_generate_new_access_code.return_value = expected_access_code

    mock_db_instance.codes.find_one.return_value = None
    mock_db_instance.codes.update_one.return_value = MagicMock(upserted_id="123")

    response = client.post(
        "/generate_access_code",
        json={"valid_for": 6}
        )
    
    mock_db_instance.codes.update_one.assert_called_once_with(
        {"code": "valid_code"},
        {"$set": expected_access_code.model_dump()},
        upsert=True
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


# Board Management Tests

@patch('backend.app.api.db')
def test_save_board_success(mock_db_instance):
    """Test successfully saving a board"""
    mock_db_instance.boards.update_one.return_value = MagicMock()

    response = client.put("/save", json={
        "name": "Test Board",
        "ringData": [
            {
                "id": 1,
                "innerRadius": 100,
                "outerRadius": 200,
                "labels": []
            }
        ]
    })

    assert response.status_code == 200
    mock_db_instance.boards.update_one.assert_called_once()


@patch('backend.app.api.db')
def test_save_board_invalid_data(mock_db_instance):
    """Test saving a board with invalid data"""
    response = client.put("/save", json={
        "name": "Test Board"
        # Missing ringData
    })

    assert response.status_code == 422


@patch('backend.app.api.db')
def test_delete_board_success(mock_db_instance):
    """Test successfully deleting a board"""
    mock_db_instance.boards.delete_one.return_value = MagicMock()

    response = client.request("DELETE", "/delete", json={
        "name": "Test Board"
    })

    assert response.status_code == 200
    mock_db_instance.boards.delete_one.assert_called_once_with({"name": "Test Board"})


@patch('backend.app.api.db')
def test_load_all_boards(mock_db_instance):
    """Test loading all boards"""
    mock_boards = [
        {"name": "Board 1", "ringData": []},
        {"name": "Board 2", "ringData": []}
    ]
    mock_db_instance.boards.find.return_value = mock_boards

    response = client.get("/load_all")

    assert response.status_code == 200
    assert response.json() == mock_boards
    mock_db_instance.boards.find.assert_called_once()


@patch('backend.app.api.db')
def test_load_all_boards_empty(mock_db_instance):
    """Test loading boards when none exist"""
    mock_db_instance.boards.find.return_value = []

    response = client.get("/load_all")

    assert response.status_code == 200
    assert response.json() == []


# Instructions Tests

@patch('backend.app.api.db')
def test_load_instructions_success(mock_db_instance):
    """Test successfully loading instructions"""
    mock_instructions = {
        "id": "0",
        "instructions": "Game instructions here"
    }
    mock_db_instance.instructions.find_one.return_value = mock_instructions

    response = client.get("/instructions")

    assert response.status_code == 200
    assert response.json() == mock_instructions
    mock_db_instance.instructions.find_one.assert_called_once_with({"id": "0"}, {"_id": 0})


@patch('backend.app.api.db')
def test_load_instructions_not_found(mock_db_instance):
    """Test loading instructions when none exist"""
    mock_db_instance.instructions.find_one.return_value = None

    response = client.get("/instructions")

    assert response.status_code == 200
    assert response.json() == {"instructions": "No instructions found."}


# User Management Tests

@patch('backend.app.api.db')
def test_accept_user_success(mock_db_instance):
    """Test successfully accepting a user"""
    mock_db_instance.users.update_one.return_value = MagicMock()

    response = client.put("/accept_user", json={
        "email": "test@example.com",
        "role": "gamemaster"
    })

    assert response.status_code == 200
    mock_db_instance.users.update_one.assert_called_once_with(
        {"email": "test@example.com"},
        {"$set": {"role": "gamemaster", "pending": False}},
        upsert=True
    )


@patch('backend.app.api.db')
def test_accept_user_invalid_data(mock_db_instance):
    """Test accepting a user with invalid data"""
    response = client.put("/accept_user", json={
        "email": "invalid-email",
        "role": "gamemaster"
    })

    assert response.status_code == 422


@patch('backend.app.api.db')
def test_remove_user_success(mock_db_instance):
    """Test successfully removing a user"""
    mock_db_instance.users.delete_one.return_value = MagicMock()

    response = client.request("DELETE", "/remove_user", json={
        "email": "test@example.com"
    })

    assert response.status_code == 200
    mock_db_instance.users.delete_one.assert_called_once_with({"email": "test@example.com"})


@patch('backend.app.api.db')
def test_load_users_success(mock_db_instance):
    """Test successfully loading all users"""
    mock_users = [
        {"email": "user1@example.com", "role": "admin"},
        {"email": "user2@example.com", "role": "gamemaster"}
    ]
    mock_codes = ["mock_code_1", "mock_code_2"]
    mock_db_instance.users.find.return_value = mock_users
    mock_db_instance.codes.find.return_value = mock_codes

    response = client.get("/load_user_data")

    assert response.status_code == 200

    expected_response = {
        "users": mock_users,
        "codes": mock_codes
    }
    assert response.json() == expected_response

    mock_db_instance.users.find.assert_called_once()
    mock_db_instance.codes.find.assert_called_once()


@patch('backend.app.api.db')
def test_load_users_empty(mock_db_instance):
    """Test loading users when none exist"""
    mock_db_instance.users.find.return_value = []
    mock_db_instance.codes.find.return_value = []

    response = client.get("/load_user_data")

    assert response.status_code == 200
    assert response.json() == {'codes': [], 'users': []}

