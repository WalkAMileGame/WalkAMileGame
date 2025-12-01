"""Database cleanup tasks for removing old game rooms"""
from datetime import datetime, timezone, timedelta
from backend.app.db import db
import logging

logger = logging.getLogger(__name__)


def cleanup_old_games():
    """
    Delete game rooms that started at least 3 hours ago.
    Uses efficient MongoDB bulk delete operation.
    """
    try:
        # Calculate cutoff time (3 hours ago)
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=3)
        cutoff_iso = cutoff_time.isoformat()

        # Delete all rooms where game_started_at exists and is older than cutoff
        # Using $lt (less than) for ISO string comparison works correctly
        result = db.rooms.delete_many({
            "game_started_at": {"$ne": None, "$lt": cutoff_iso}
        })

        deleted_count = result.deleted_count
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old game room(s)")
        else:
            logger.debug("No old game rooms to clean up")

        return deleted_count

    except Exception as e:
        logger.error(f"Error during game cleanup: {e}")
        return 0


def create_cleanup_index():
    """
    Create an index on game_started_at field for efficient cleanup queries.
    This should be called during application startup.
    """
    try:
        # Create index on game_started_at for fast cleanup queries
        # Sparse index only includes documents where the field exists
        db.rooms.create_index("game_started_at", sparse=True)
        logger.info("Created index on game_started_at field")
    except Exception as e:
        logger.warning(f"Could not create cleanup index: {e}")
