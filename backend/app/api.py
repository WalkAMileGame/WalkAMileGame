"""fast api logic"""
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.models import Points, Boards, LoginRequest, RegisterRequest, AcceptUser, DenyUser, LayerData, Room, Team, UserData
from .db import db
from datetime import datetime, timedelta, timezone
from typing import Dict
from backend.app.security import verify_password, create_access_token, get_current_active_user, get_password_hash
from backend.app.code_management import generate_new_access_code, is_code_expired, activate_code

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


# --------------------------------------------------------------------------------------------
#                               User management endpoints
# --------------------------------------------------------------------------------------------


@router.post("/login")
def login(form_data: LoginRequest):
    user_in_db = db.users.find_one({"email": form_data.email})
    user_access_code = db.codes.find_one({"email": form_data.email})

    if not user_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user_access_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account hasn't been activated"
        )

    if is_code_expired(user_access_code["code"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account has expired"
        )

    user = UserData(email=user_in_db["email"], password=user_in_db["password"],
                    role=user_in_db["role"])
    
    if not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    user_info = {"email": user.email, "role": user.role}

    return {"access_token": access_token, "user": user_info}


@router.post("/register")
def register(form_data: RegisterRequest):
    user_in_db = db.users.find_one({"email": form_data.email})

    if user_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email already in use",
        )

    unactivated_code = db.codes.find_one({"code": form_data.code})

    if not unactivated_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect activation code",
        )

    hashed_password = get_password_hash(form_data.password)
    user = UserData(email=form_data.email, password=hashed_password)

    db.users.update_one({"email": user.email},
                        {"$set": {"email": user.email, "password": hashed_password,
                        "role": user.role}}, upsert=True)
    
    activated_code = activate_code(unactivated_code)

    db.codes.update_one({"code": activated_code.code},
                        {"$set": {"code": activated_code.code,
                                  "creationTime": activated_code.creationTime,
                                  "expirationTime": activated_code.expirationTime,
                                  "activationTime": activated_code.activationTime,
                                  "isUsed": activated_code.isUsed,
                                  "usedByUser": activated_code.usedByUser}})


@router.post("/generate_access_code")
def generate_access_code(valid_for=6):

    # Generate a new code until a unique one is generated
    while True:
        new_code = generate_new_access_code(valid_for)

        code_in_db = db.codes.find_one({"code": new_code.code})

        if not code_in_db:
            break
    
    db.codes.update_one({"code": new_code.code},
                        {"$set": {"code": new_code.code,
                                  "creationTime": new_code.creationTime,
                                  "expirationTime": new_code.expirationTime,
                                  "activationTime": new_code.activationTime,
                                  "isUsed": new_code.isUsed,
                                  "usedByUser": new_code.usedByUser}})


@router.get("/users/me", tags=["auth"])
def read_current_user(current_user: dict = Depends(get_current_active_user)):
    return current_user


# --------------------------------------------------------------------------------------------
#                               User management endpoints over
# --------------------------------------------------------------------------------------------


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
    
    return team.get("gameboard_state", {})


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
