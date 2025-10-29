from os import getenv
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from bcrypt import checkpw, hashpw, gensalt
from fastapi import Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer
from .db import db


load_dotenv()
SECRET_KEY = getenv("SECRET_KEY")
ALGORITHM = getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    return hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    
    now = datetime.now(timezone.utc) 
    
    to_encode.update({"iat": now})

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_active_user(response: Response, token: str = Depends(oauth2_scheme)):
    """
    Decodes token, verifies user in DB, and handles token refresh.
    This is the all-in-one dependency for protected routes.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        issued_at_ts = payload.get("iat")
        
        if not email or not issued_at_ts:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token payload"
            )

        issued_at = datetime.fromtimestamp(issued_at_ts, tz=timezone.utc)
        token_age = datetime.now(timezone.utc) - issued_at
        
        if token_age > timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES / 2):
            new_token_data = {"sub": email, "role": payload.get("role")}
            new_token = create_access_token(data=new_token_data)
            response.headers["X-Token-Refresh"] = new_token

    except jwt.ExpiredSignatureError:
        print("Expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token expired"
        )
    except (jwt.InvalidTokenError, Exception):
        print("Could not validate")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate token"
        )

    user_doc = db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if not user_doc:
        print("not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found"
        )

    # Return the user document
    return user_doc