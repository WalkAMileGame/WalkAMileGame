"""fast api logic"""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.models import Points, Boards, LoginRequest, RegisterRequest
from .db import db
from backend.app.security import verify_password, create_access_token, get_current_active_user, get_password_hash
from datetime import datetime, timedelta, timezone


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
    