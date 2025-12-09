"""run uvicorn app"""
import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import router
from backend.app.cleanup import cleanup_old_games, create_cleanup_index
from backend.app.db import initialize_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create scheduler instance
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):  # pylint: disable=unused-argument
    """Handle startup and shutdown events"""
    # Startup
    if os.getenv('TESTING') != 'true':
        initialize_database()
        create_cleanup_index()

        # Schedule cleanup task to run every 2 hours
        scheduler.add_job(
            cleanup_old_games,
            'interval',
            hours=2,
            id='cleanup_old_games',
            replace_existing=True
        )
        scheduler.start()
        logging.info("Scheduler started: cleanup runs every 2 hours")

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
        logging.info("Scheduler shut down")


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "localhost:5173",
    "https://walkamile.ext.ocp-test-0.k8s.it.helsinki.fi"
]
ORIGIN_REGEX = r"^https?://([a-z0-9-]+\.)*ext\.ocp-test-0\.k8s\.it\.helsinki\.fi(:\d+)?$"
app.add_middleware(
    CORSMiddleware,
    # This must be changed before production.
    allow_origins=["*"],
    allow_origin_regex=ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Token-Refresh"]
)

app.include_router(router)

# test
if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
