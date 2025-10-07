"""backend information such as variables"""
from pydantic import BaseModel

class Points(BaseModel):
    values: int

class Boards(BaseModel):
    name: str
    rings: list[dict]
