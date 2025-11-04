"""fast api logic"""
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.models import Points, Boards, LoginRequest, Room, Team, LayerData
from .db import db
from backend.app.security import verify_password, create_access_token, get_current_active_user
from datetime import datetime, timedelta
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
    
rooms: Dict[str, Room] = {}

@router.post("/rooms/create")
def create_room(room: Room):
    """Creates a new room"""
    if room.room_code in rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    rooms[room.room_code] = room
    return {"message": "Room created", "room": room}

@router.get("/rooms/{code}")
def get_room(code: str):
    """Fetch room info"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms[code]

@router.post("/rooms/{code}/teams")
def add_team(code: str, team_data: dict = Body(...)):
    """Adds a new team to a room"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[code]
    teams = room.teams or []

    new_team = Team(
        id=len(teams) + 1,
        team_name=team_data.get("team_name"),
        circumstance=team_data.get("circumstance", ""),
        current_energy=32,
        gameboard_state=LayerData(
            id=0, name="Board", innerRadius=0, outerRadius=0, labels=[]
        ),
    )

    teams.append(new_team)
    room.teams = teams
    rooms[code] = room
    return {"message": "Team added", "team": new_team}

@router.post("/rooms/{code}/start")
def start_game(code: str):
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[code]
    room.game_started = True
    rooms[code] = room
    return {"message": "Game started"}

@router.get("/rooms/{code}/teams/{team_name}/board")
def get_team_board(code: str, team_name: str):
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[code]
    team = next((t for t in room.teams if t.team_name == team_name), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return team.gameboard_state

class UpdateTeamBoard(BaseModel):
    board_state: dict

@router.put("/rooms/{code}/teams/{team_name}/board")
def update_team_board(code: str, team_name: str, data: UpdateTeamBoard):
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[code]
    team = next((t for t in room.teams if t.team_name == team_name), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    team.gameboard_state = data.gameboard_state
    return {"message": "Board updated"}

@router.get("/rooms/{code}/teams/{team_name}/energy")
def get_team_energy(code:str, team_name: str):
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[code]
    team = next((t for t in room.teams if t.team_name == team_name), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return {"current_energy": team.current_energy}

class UpdateTeamEnergy(BaseModel):
    change: int

@router.put("/rooms/{code}/teams/{team_name}/energy")
def update_team_energy(code: str, team_name: str, data: UpdateTeamEnergy):
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[code]
    team = next((t for t in room.teams if t.team_name == team_name), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    new_energy = max(0, team.current_energy + data.change)
    team.current_energy = new_energy
    return {"current_energy": new_energy}
