"""fast api logic"""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.models import Points, Boards, LoginRequest, Room, Team
from .db import db
from backend.app.security import verify_password, create_access_token, get_current_active_user
from datetime import datetime, timedelta, timezone
from typing import Dict

router = APIRouter()

@router.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to your todo list."}


@router.get("/items", response_model=Points)
def get_items():
    """Get current energy points"""
    energy_points = list(db.points.find({}, {"_id": 0}))
    return energy_points[0]


class ChangePoints(BaseModel):
    change: int


@router.put("/items", response_model=Points)
def update_points(data: ChangePoints):
    """update points in databse"""
    db.points.update_one(
        {"id": "0"}, {"$inc": {"values": data.change}}, upsert=True)
    updated_points = db.points.find_one({"id": "0"}, {"_id": 0})
    return updated_points


class NewBoard(BaseModel):
    name: str
    rings: list


@router.put("/save")
def save_board(data: NewBoard):
    db.boards.update_one({"name": data.name},
                         {"$set": {"name": data.name, "ringData": data.ringData}},
                         upsert=True)


class DeleteBoard(BaseModel):
    name: str


@router.delete("/delete")
def delete_board(data: DeleteBoard):
    db.boards.delete_one({"name": data.name})


@router.get("/load_all")
def load_boards():
    boards = list(db.boards.find(projection={"_id": False}))
    return boards


@router.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint to verify backend is running"""

    try:
        db.client.server_info()

        return {
            "status": "healthy",
            "message": "Backend server is running"
        }
    except Exception as e:  # pylint: disable=broad-exception-caught
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }


@router.get("/instructions")
def load_instructions():
    """Load instructions from database"""
    instructions_doc = db.instructions.find_one({"id": "0"}, {"_id": 0})
    if instructions_doc:
        return instructions_doc
    return {"instructions": "No instructions found."}

@router.post("/login")
def login(form_data: LoginRequest):
    user_in_db = db.users.find_one({"email": form_data.email})
    #print("form data:", form_data)
    #print("db output:", user_in_db)
    #pw = get_password_hash(form_data.password)
    #print("hashed:", pw)

    if not user_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not verify_password(form_data.password, user_in_db["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(
        data={"sub": user_in_db["email"], "role": user_in_db["role"]}
    )

    user_info = {"email": user_in_db["email"], "role": user_in_db["role"]}

    return {"access_token": access_token, "user": user_info}

@router.get("/users/me", tags=["auth"])
def read_current_user(current_user: dict = Depends(get_current_active_user)):
    return current_user


@router.get("/timer")
def get_time(site: str ="game"):
    durations = {"lobby": 5 * 60, "game": 30 * 60}
    
    duration = durations.get(site, 60)
    now = datetime.now(timezone.utc)
    end = now + timedelta(seconds=duration)
    return {
        "server_time": now.isoformat(),
        "start": now.isoformat(),
        "end": end.isoformat(),
        "duration": duration
    }


# Room Management Endpoints

@router.post("/rooms/create")
def create_room(room: Room):
    """Create a new game room"""
    try:
        # Check if room already exists
        existing_room = db.rooms.find_one({"room_code": room.room_code.upper()})
        if existing_room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room with this code already exists"
            )
        
        # Create room document
        room_doc = {
            "room_code": room.room_code.upper(),
            "gamemaster_name": room.gamemaster_name,
            "board_config": room.board_config,
            "teams": [],
            "time_remaining": room.time_remaining,
            "game_started": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.rooms.insert_one(room_doc)
        return {"message": "Room created successfully", "room_code": room.room_code.upper()}
    except Exception as e:
        print(f"Error creating room: {str(e)}")
        raise


@router.get("/rooms/{room_code}")
def get_room(room_code: str):
    """Get room data by room code"""
    room = db.rooms.find_one({"room_code": room_code.upper()}, {"_id": 0})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room


@router.post("/rooms/{room_code}/teams")
def add_team(room_code: str, team: Team):
    """Add a team to a room"""
    room = db.rooms.find_one({"room_code": room_code.upper()})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if team name already exists
    existing_teams = room.get("teams", [])
    if any(t["team_name"] == team.team_name for t in existing_teams):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists"
        )
    
    # Add team to room
    team_doc = {
        "team_name": team.team_name,
        "circumstance": team.circumstance,
        "board_status": team.board_status
    }
    
    db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$push": {"teams": team_doc}}
    )
    
    return {"message": "Team added successfully"}


@router.delete("/rooms/{room_code}/teams/{team_name}")
def delete_team(room_code: str, team_name: str):
    """Delete a team from a room"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$pull": {"teams": {"team_name": team_name}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return {"message": "Team deleted successfully"}


class TimeUpdate(BaseModel):
    time_remaining: int


@router.post("/rooms/{room_code}/time")
def update_time(room_code: str, time_update: TimeUpdate):
    """Update time remaining for a room"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": {"time_remaining": time_update.time_remaining}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return {"message": "Time updated successfully"}


@router.post("/rooms/{room_code}/start")
def start_game(room_code: str):
    """Start the game for a room"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": {"game_started": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return {"message": "Game started successfully"}
