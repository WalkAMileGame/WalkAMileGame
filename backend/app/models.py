"""backend information such as variables"""
from pydantic import BaseModel, EmailStr, field_validator, Field
from enum import Enum
from typing import List, Optional
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

class Team(BaseModel):
    id: int
    team_name: str
    circumstance: str
    current_energy: int
    gameboard_state: LayerData

class Room(BaseModel):
    room_code: str
    gamemaster_name: str
    board_config: Boards
    time_remaining: int = 30
    teams: List[Team] = []
    game_started: bool = False
    created_at: Optional[str] = None

    @field_validator('room_code')
    def code_must_be_valid(cls, v):
        if not v or len(v) < 4:
            raise ValueError('Room code must be at least 4 characters')
        return v.upper()
