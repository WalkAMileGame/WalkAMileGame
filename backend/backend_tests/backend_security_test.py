"""Tests for security.py functions"""

import os
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt, ExpiredSignatureError, JWTError
from fastapi import HTTPException, status, Response

os.environ['SECRET_KEY'] = 'test_secret_key'
os.environ['ALGORITHM'] = 'HS256'
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'

from backend.app import security

security.SECRET_KEY = os.getenv("SECRET_KEY")
security.ALGORITHM = os.getenv("ALGORITHM")
security.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

jwt.InvalidTokenError = JWTError


def test_password_hashing():
    """Test password hashing and verification."""
    password = "plain_password_123"
    hashed_password = security.get_password_hash(password)

    assert isinstance(hashed_password, str)
    assert len(hashed_password) > 0

    assert security.verify_password(password, hashed_password) == True

    assert security.verify_password("wrong_password", hashed_password) == False

    with pytest.raises(ValueError):
        security.verify_password(password, "invalid_hash_format")


def test_create_access_token_default_expiry():
    """Test token creation with default expiry."""
    data = {"sub": "test@example.com", "role": "user"}
    token = security.create_access_token(data)

    payload = jwt.decode(
        token,
        security.SECRET_KEY,
        algorithms=[security.ALGORITHM]
    )

    assert payload["sub"] == "test@example.com"
    assert payload["role"] == "user"

    # Check expiry
    iat_time = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    expected_expiry = iat_time + timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Allow a small buffer for execution time
    assert abs(exp_time - expected_expiry) < timedelta(seconds=5)


def test_create_access_token_custom_expiry():
    """Test token creation with a custom expiry delta."""
    data = {"sub": "custom@example.com"}
    custom_delta = timedelta(minutes=60)
    token = security.create_access_token(data, expires_delta=custom_delta)

    payload = jwt.decode(
        token,
        security.SECRET_KEY,
        algorithms=[security.ALGORITHM]
    )

    assert payload["sub"] == "custom@example.com"

    # Check expiry
    token_iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    token_expiry = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    expected_expiry = token_iat + custom_delta

    # Allow a small buffer for execution time
    assert abs(expected_expiry - token_expiry) < timedelta(seconds=5)


@patch('backend.app.security.db')
@patch('backend.app.security.datetime')
@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_success(mock_jwt_decode, mock_datetime_class, mock_db):
    """Test successful user authentication and retrieval."""

    mock_now = datetime.now(timezone.utc)
    mock_datetime_class.now.return_value = mock_now

    mock_datetime_class.fromtimestamp.side_effect = datetime.fromtimestamp

    mock_user = {"email": "test@example.com", "username": "testuser", "role": "admin"}
    test_token = "valid.token.string"
    
    iat_time = mock_now - timedelta(minutes=10)
    mock_payload = {
        "sub": "test@example.com",
        "role": "admin",
        "iat": iat_time.timestamp()
    }
    
    mock_jwt_decode.return_value = mock_payload
   
    mock_db.users.find_one.return_value = mock_user

    mock_response = MagicMock(spec=Response)
    mock_response.headers = {}
  
    user = security.get_current_active_user(response=mock_response, token=test_token)
    
    mock_datetime_class.now.assert_called_with(timezone.utc) 

    mock_jwt_decode.assert_called_once_with(
        test_token,
        security.SECRET_KEY,
        algorithms=[security.ALGORITHM]
    )
    mock_db.users.find_one.assert_called_once_with(
        {"email": "test@example.com"},
        {"_id": 0, "password": 0}
    )
    assert user == mock_user
    # Token is not old enough to be refreshed
    assert "X-Token-Refresh" not in mock_response.headers


@patch('backend.app.security.db')
@patch('backend.app.security.datetime')
@patch('backend.app.security.jwt.decode')
@patch('backend.app.security.create_access_token')
def test_get_current_active_user_token_refresh(mock_create_token, mock_jwt_decode, mock_datetime_class, mock_db):
    """Test successful authentication with token refresh."""

    mock_now = datetime.now(timezone.utc)
    mock_datetime_class.now.return_value = mock_now

    mock_datetime_class.fromtimestamp.side_effect = datetime.fromtimestamp

    mock_user = {"email": "test@example.com", "username": "testuser", "role": "user"}
    test_token = "valid.but.old.token"
    refreshed_token = "new.refreshed.token"
    
    iat_time = mock_now - timedelta(minutes=20) # Token issued 20 mins ago (past 15 min threshold)
    mock_payload = {
        "sub": "test@example.com",
        "role": "user",
        "iat": iat_time.timestamp()
    }
    mock_jwt_decode.return_value = mock_payload
    
    mock_db.users.find_one.return_value = mock_user
    
    mock_create_token.return_value = refreshed_token
    
    mock_response = MagicMock(spec=Response)
    mock_response.headers = {}

    user = security.get_current_active_user(response=mock_response, token=test_token)
    
    mock_datetime_class.now.assert_called_with(timezone.utc) 

    assert user == mock_user
    # Verify refresh token was created and added to headers
    mock_create_token.assert_called_once_with(
        data={"sub": "test@example.com", "role": "user"}
    )
    assert mock_response.headers["X-Token-Refresh"] == refreshed_token


@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_token_expired(mock_jwt_decode):
    """Test for an expired token."""
    mock_jwt_decode.side_effect = ExpiredSignatureError("Signature has expired.")
    mock_response = MagicMock(spec=Response)

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_active_user(response=mock_response, token="expired.token")
    
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Token expired"


@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_invalid_token(mock_jwt_decode):
    """Test for an invalid token."""

    mock_jwt_decode.side_effect = jwt.InvalidTokenError("Invalid token") 
    mock_response = MagicMock(spec=Response)

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_active_user(response=mock_response, token="invalid.token")
    
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate token"


@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_invalid_payload_sub(mock_jwt_decode):
    """Test for a token with missing 'sub' claim."""
    mock_payload = {"iat": datetime.now(timezone.utc).timestamp()}
    mock_jwt_decode.return_value = mock_payload
    mock_response = MagicMock(spec=Response)

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_active_user(response=mock_response, token="no.sub.token")
    
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate token"


@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_invalid_payload_iat(mock_jwt_decode):
    """Test for a token with missing 'iat' claim."""
    mock_payload = {"sub": "test@example.com"}
    mock_jwt_decode.return_value = mock_payload
    mock_response = MagicMock(spec=Response)

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_active_user(response=mock_response, token="no.iat.token")
    
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate token"


@patch('backend.app.security.db')
@patch('backend.app.security.jwt.decode')
def test_get_current_active_user_not_found(mock_jwt_decode, mock_db):
    """Test for a user that exists in the token but not in the database."""
    mock_payload = {
        "sub": "ghost@example.com",
        "iat": datetime.now(timezone.utc).timestamp()
    }
    mock_jwt_decode.return_value = mock_payload
    
    mock_db.users.find_one.return_value = None
    mock_response = MagicMock(spec=Response)

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_active_user(response=mock_response, token="ghost.user.token")
    
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "User not found"
