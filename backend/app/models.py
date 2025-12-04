"""backend information such as variables"""
from pydantic import BaseModel, EmailStr, field_validator, Field
from enum import Enum
from typing import List, Optional
from datetime import datetime


class Points(BaseModel):
    id: str
    values: int

class TileType(str, Enum):
    """Types of tiles that can appear on the board"""
    ACTION = "action"
    RING_TITLE = "ring_title"


class Circumstance(BaseModel):
    id: str
    title: str
    description: str
    author: str
    
class LabelData(BaseModel):
    id: int
    text: str
    color: str
    energyvalue: int
    energypoint: bool = False
    required_for: List[str] = []
    tileType: TileType = TileType.ACTION

class LayerData(BaseModel):
    id: int
    innerRadius: int
    outerRadius: int
    labels: List[LabelData]

class Boards(BaseModel):
    name: str
    circumstances: List[Circumstance] = []
    ringData: List[LayerData]

class UserData(BaseModel):
    email: EmailStr
    password: str
    role: str = "gamemaster"
    boards: List[Boards] = []

class AccessCode(BaseModel):
    code: str
    creationTime: datetime
    expirationTime: datetime
    activationTime: datetime = None
    isUsed: bool = False
    usedByUser: EmailStr = None

class GenerateCodeRequest(BaseModel):
    valid_for: int

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    code: str

class RenewRequest(BaseModel):
    email: EmailStr
    password: str
    new_code: str

class AcceptUser(BaseModel):
    email: EmailStr
    role: str

class DenyUser(BaseModel):
    email: EmailStr

class Team(BaseModel):
    id: int
    team_name: str
    circumstance: str
    current_energy: int =32
    gameboard_state: Optional[LayerData] = None

class Room(BaseModel):
    room_code: str
    gamemaster_name: str
    board_config: Boards
    time_remaining: int = 30
    teams: List[Team] = Field(default_factory=list)
    game_started: bool = False
    game_started_at: Optional[str] = None
    game_paused: bool = False
    paused_at: Optional[str] = None
    accumulated_pause_time: int = 0
    comparison_mode: bool = False

    @field_validator('room_code')
    def code_must_be_valid(cls, v):
        if not v or len(v) < 4:
            raise ValueError('Room code must be at least 4 characters')
        return v.upper()

