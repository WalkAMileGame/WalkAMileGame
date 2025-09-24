"""fast api logic"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from .db import db
from pydantic import BaseModel
from backend.app.models import Points, Labels


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
    rings: list[dict]
@router.put("/save")
def save_board(data: NewBoard):
    for i, ring in enumerate(data.rings):
        for label in ring["labels"]:
            db.labels.insert_one({'title': label["text"], 'color': label["color"], 'ring': i+1, "board": data.name})
