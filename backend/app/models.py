from pydantic import BaseModel

class Points(BaseModel):
    values: int

class Labels(BaseModel):
    title: str
    color: str
    ring: int
