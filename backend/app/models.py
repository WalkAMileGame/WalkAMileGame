"""backend information such as variables"""
from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum


class Points(BaseModel):
    id: str
    values: int


class Boards(BaseModel):
    name: str
    rings: list

class Role(str, Enum):
    """all existing roles are defined here"""
    ADMIN = "admin"
    GAMEMASTER = "gamemaster"

class UserData(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.GAMEMASTER
    pending: bool = True

    @field_validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class LoginRequest(BaseModel):
    """Model for the data expected in a login request."""
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class AcceptUser(BaseModel):
    email: EmailStr
    role: str

class DenyUser(BaseModel):
    email: EmailStr
