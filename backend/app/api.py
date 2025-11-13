"""fast api logic"""
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.models import Points, Boards, LoginRequest, RegisterRequest, AcceptUser, DenyUser, LayerData, Room, Team
from .db import db
from datetime import datetime, timedelta, timezone
from typing import Dict
from backend.app.security import verify_password, create_access_token, get_current_active_user, get_password_hash

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
    ringData: list


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
    pw = get_password_hash(form_data.password)
    #print("hashed:", pw)
    #db.users.update_one({"email": form_data.email}, {"$set": {"email": form_data.email, "password": pw, "role": "admin", "pending": True}}, upsert=True)
    #print(list(db.users.find()))

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
    
    if user_in_db["pending"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account still pending to be accepted"
        )
    
    access_token = create_access_token(
        data={"sub": user_in_db["email"], "role": user_in_db["role"]}
    )

    user_info = {"email": user_in_db["email"], "role": user_in_db["role"]}

    return {"access_token": access_token, "user": user_info}


@router.post("/register")
def register(form_data: RegisterRequest):
    user_in_db = db.users.find_one({"email": form_data.email})

    if user_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email already in use",
        )

    #print("register for data:", form_data)
    hashed_password = get_password_hash(form_data.password)
    db.users.update_one({"email": form_data.email},
                        {"$set": {"email": form_data.email, "password": hashed_password,
                        "role": "admin", "pending": True}}, upsert=True)


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
        print("=== CREATE ROOM REQUEST ===")
        print(f"room_code: {room.room_code}")
        print(f"gamemaster_name: {room.gamemaster_name}")
        print(f"board_config type: {type(room.board_config)}")
        print(f"board_config: {room.board_config}")
        print(f"time_remaining: {room.time_remaining}")
        print(f"teams: {room.teams}")
        print(f"game_started: {room.game_started}")
        
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
            "board_config": room.board_config.model_dump() if hasattr(room.board_config, 'model_dump') else room.board_config.dict(),
            "teams": [],
            "time_remaining": room.time_remaining,
            "game_started": False
        }
        
        print("=== ROOM DOCUMENT TO INSERT ===")
        print(room_doc)
        
        db.rooms.insert_one(room_doc)
        return {"message": "Room created successfully", "room_code": room.room_code.upper()}
    except Exception as e:
        print(f"=== ERROR CREATING ROOM ===")
        print(f"Error type: {type(e)}")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
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
    
    # Add team to room - convert Pydantic model to dict for MongoDB
    team_doc = {
        "id": team.id,
        "team_name": team.team_name,
        "circumstance": team.circumstance,
        "current_energy": team.current_energy,
        "gameboard_state": team.gameboard_state.model_dump() if hasattr(team.gameboard_state, 'model_dump') else team.gameboard_state.dict()
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


class CircumstanceUpdate(BaseModel):
    circumstance: str


@router.put("/rooms/{room_code}/teams/{team_name}/circumstance")
def update_team_circumstance(room_code: str, team_name: str, update: CircumstanceUpdate):
    """Update a team's circumstance"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper(), "teams.team_name": team_name},
        {"$set": {"teams.$.circumstance": update.circumstance}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room or team not found"
        )
    
    return {"message": "Circumstance updated successfully"}


class TimeUpdate(BaseModel):
    time_remaining: int
    reset_timer: bool = False


@router.post("/rooms/{room_code}/time")
def update_time(room_code: str, time_update: TimeUpdate):
    """Update time remaining for a room"""
    update_fields = {"time_remaining": time_update.time_remaining}

    # If reset_timer is True, reset the game_started_at timestamp and accumulated_pause_time
    # This ensures the timer starts at exactly the specified minutes with :00 seconds
    if time_update.reset_timer:
        update_fields["game_started_at"] = datetime.now(timezone.utc).isoformat()
        update_fields["accumulated_pause_time"] = 0
        update_fields["paused_at"] = None
        update_fields["game_paused"] = False

    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": update_fields}
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
        {"$set": {"game_started": True,
                  "game_started_at": datetime.now(timezone.utc).isoformat()
                  }}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    return {"message": "Game started successfully"}


@router.post("/rooms/{room_code}/pause")
def pause_game(room_code: str):
    """Pause the game timer for a room"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": {
            "game_paused": True,
            "paused_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    return {"message": "Game paused successfully"}


@router.post("/rooms/{room_code}/resume")
def resume_game(room_code: str):
    """Resume the game timer for a room"""
    room = db.rooms.find_one({"room_code": room_code.upper()})

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    # Calculate accumulated pause time
    accumulated_pause_time = room.get("accumulated_pause_time", 0)
    if room.get("game_paused") and room.get("paused_at"):
        paused_at = datetime.fromisoformat(room["paused_at"])
        pause_duration = (datetime.now(timezone.utc) - paused_at).total_seconds()
        accumulated_pause_time += int(pause_duration)

    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": {
            "game_paused": False,
            "paused_at": None,
            "accumulated_pause_time": accumulated_pause_time
        }}
    )

    return {"message": "Game resumed successfully"}


@router.post("/rooms/{room_code}/end")
def end_game(room_code: str):
    """End the game for a room"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper()},
        {"$set": {
            "game_started": False,
            "game_paused": False,
            "time_remaining": 0
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    return {"message": "Game ended successfully"}


# Team Board and Energy Management Endpoints

class UpdateTeamBoard(BaseModel):
    board_state: dict


@router.get("/rooms/{room_code}/teams/{team_name}/board")
def get_team_board(room_code: str, team_name: str):
    """Get a team's board state"""
    room = db.rooms.find_one({"room_code": room_code.upper()}, {"_id": 0})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Find the team in the room
    team = next((t for t in room.get("teams", []) if t["team_name"] == team_name), None)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return {"ringData": team.get("gameboard_state", {}).get("ringData", [])}


@router.put("/rooms/{room_code}/teams/{team_name}/board")
def update_team_board(room_code: str, team_name: str, data: UpdateTeamBoard):
    """Update a team's board state"""
    result = db.rooms.update_one(
        {"room_code": room_code.upper(), "teams.team_name": team_name},
        {"$set": {"teams.$.gameboard_state": data.board_state}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room or team not found"
        )
    
    return {"message": "Board updated successfully"}


class UpdateTeamEnergy(BaseModel):
    change: int


@router.get("/rooms/{room_code}/teams/{team_name}/energy")
def get_team_energy(room_code: str, team_name: str):
    """Get a team's current energy"""
    room = db.rooms.find_one({"room_code": room_code.upper()}, {"_id": 0})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Find the team in the room
    team = next((t for t in room.get("teams", []) if t["team_name"] == team_name), None)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return {"current_energy": team.get("current_energy", 0)}


@router.put("/rooms/{room_code}/teams/{team_name}/energy")
def update_team_energy(room_code: str, team_name: str, data: UpdateTeamEnergy):
    """Update a team's energy (increment/decrement)"""
    room = db.rooms.find_one({"room_code": room_code.upper()})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Find the team in the room
    team = next((t for t in room.get("teams", []) if t["team_name"] == team_name), None)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Calculate new energy (ensure it doesn't go below 0)
    current_energy = team.get("current_energy", 0)
    new_energy = max(0, current_energy + data.change)
    
    # Update in database
    result = db.rooms.update_one(
        {"room_code": room_code.upper(), "teams.team_name": team_name},
        {"$set": {"teams.$.current_energy": new_energy}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room or team not found"
        )
    
    return {"current_energy": new_energy}


@router.put("/accept_user")
def add_user(data: AcceptUser):
    db.users.update_one({"email": data.email},
                        {"$set": {"role": data.role, "pending": False}},
                        upsert=True)
    
@router.delete("/remove_user")
def delete_board(data: DenyUser):
    db.users.delete_one({"email": data.email})
    
@router.get("/load_users")
def load_users():
    users = list(db.users.find(projection={"_id": False}))
    return users
