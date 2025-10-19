"""fast api logic"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.models import Points, Boards
from .db import db



router = APIRouter()


@router.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to your todo list."}

@router.get("/items", response_model=Points)
def get_items():
    collections = db.list_collection_names()
    energy_points = list(db.points.find({}, {"_id": 0}))
    return energy_points[0]

class ChangePoints(BaseModel):
    change: int
@router.put("/items", response_model=Points)
def update_points(data: ChangePoints):
    result = db.points.update_one({"id":"0"}, {"$inc": {"values": data.change}}, upsert=True)
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

@router.get("/instructions")
def load_instructions():
    instructions_doc = db.instructions.find_one({"id": "0"}, {"_id": 0})
    if instructions_doc:
        return instructions_doc
    return {"instructions": "No instructions found."}