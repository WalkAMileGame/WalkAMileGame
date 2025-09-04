"""fast api logic"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from .db import db


router = APIRouter()



@router.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to your todo list."}

@router.get("/items")
def get_items():
    collections = db.list_collection_names()
    return(collections)
    #return list(db.myCollection.find({}, {"_id": 0}))
