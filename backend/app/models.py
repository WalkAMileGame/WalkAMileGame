"""backend information such as variables"""
from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum
from datetime import datetime

class Points(BaseModel):
    id: str
    values: int
    
class LabelData(BaseModel):
    id: int
    text: str
    color: str
    energyvalue: str
    energypoint: bool

class LayerData(BaseModel):
    id: int
    name: str
    innerRadius: int
    outerRadius: int
    labels: list[LabelData]

class Boards(BaseModel):
    name: str
    rings: list[LayerData]
    

class Groups(BaseModel):
    id: int
    name: str
    current_energy: int
    gameboard_state: LayerData
    role: str
    
class Game(BaseModel):
    code: str
    time: datetime
    gameboard: Boards
    groups: list[Groups]
    

class Role(str, Enum):
    """all existing roles are defined here"""
    ADMIN = "admin"
    GAMEMASTER = "gamemaster"

class UserData(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.GAMEMASTER

    @field_validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class LoginRequest(BaseModel):
    """Model for the data expected in a login request."""
    email: EmailStr
    password: str
