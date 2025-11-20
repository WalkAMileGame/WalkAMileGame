"""run uvicorn app"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import router
from backend.app.db import initialize_database
import jose
print(f"Jose version: {jose.__version__}")
print(f"Jose path: {jose.__file__}")

try:
    from jose import jws
    print(f"Available algorithms: {jws.ALGORITHMS.SUPPORTED}")
except Exception as e:
    print(f"Error checking algorithms: {e}")
app = FastAPI()

if os.getenv('TESTING') != 'true':
    initialize_database()

origins = [
    "http://localhost:5173",
    "localhost:5173",
    "https://walkamile.ext.ocp-test-0.k8s.it.helsinki.fi"
]
origin_regex = r"^https?://([a-z0-9-]+\.)*ext\.ocp-test-0\.k8s\.it\.helsinki\.fi(:\d+)?$"
app.add_middleware(
    CORSMiddleware,
    #This must be changed before production.
    allow_origins=["*"],
    #allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

#test
if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
