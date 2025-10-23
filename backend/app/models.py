"""backend information such as variables"""
from pydantic import BaseModel


class Points(BaseModel):
    id: str
    values: int


class Boards(BaseModel):
    name: str
    rings: list
