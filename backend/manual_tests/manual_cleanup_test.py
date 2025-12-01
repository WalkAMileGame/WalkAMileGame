"""
Manual testing script for cleanup functionality.
This script allows you to test the cleanup function with real database data.

Usage:
    python -m backend.manual_cleanup_test

WARNING: This script uses your real MongoDB database. It creates test rooms
with codes starting with "TEST_" and cleans them up afterward.
"""
from datetime import datetime, timezone, timedelta
from backend.app.db import db, initialize_database
from backend.app.cleanup import cleanup_old_games, create_cleanup_index
from backend.app.models import Room, Boards, LayerData


def create_test_room(code: str, hours_ago: int = 0):
    """Create a test room with game_started_at set to X hours ago"""
    test_board = Boards(
        name="Test Board",
        circumstances=[],
        ringData=[
            LayerData(
                id=1,
                innerRadius=100,
                outerRadius=200,
                labels=[]
            )
        ]
    )

    game_started_at = None
    if hours_ago > 0:
        game_started_at = (
            datetime.now(timezone.utc) - timedelta(hours=hours_ago)
        ).isoformat()

    room = Room(
        room_code=code,
        gamemaster_name="Test GM",
        board_config=test_board,
        game_started=hours_ago > 0,
        game_started_at=game_started_at
    )

    # Insert into database
    db.rooms.insert_one(room.model_dump())
    print(f"Created room '{code}' with game_started_at: {game_started_at}")


def list_all_rooms():
    """List all rooms in the database"""
    rooms = list(db.rooms.find())
    print(f"\nTotal rooms in database: {len(rooms)}")
    for room in rooms:
        print(f"  - {room['room_code']}: "
              f"started={room.get('game_started', False)}, "
              f"started_at={room.get('game_started_at', 'N/A')}")
    return rooms


def run_manual_test():
    """Run a complete manual test of the cleanup functionality"""
    print("=" * 60)
    print("MANUAL CLEANUP TEST")
    print("=" * 60)

    # Initialize database
    print("\n1. Initializing database...")
    initialize_database()
    create_cleanup_index()

    # Clean up any existing test rooms
    print("\n2. Cleaning up existing test rooms...")
    db.rooms.delete_many({"room_code": {"$regex": "^TEST"}})

    # Create test data
    print("\n3. Creating test rooms...")
    create_test_room("TEST_NEW", hours_ago=0)  # New, not started
    create_test_room("TEST_1HR", hours_ago=1)  # 1 hour old (should NOT be deleted)
    create_test_room("TEST_2HR", hours_ago=2)  # 2 hours old (should NOT be deleted)
    create_test_room("TEST_3HR", hours_ago=3)  # 3 hours old (SHOULD be deleted)
    create_test_room("TEST_4HR", hours_ago=4)  # 4 hours old (SHOULD be deleted)
    create_test_room("TEST_5HR", hours_ago=5)  # 5 hours old (SHOULD be deleted)

    # List rooms before cleanup
    print("\n4. Rooms BEFORE cleanup:")
    rooms_before = list_all_rooms()

    # Run cleanup
    print("\n5. Running cleanup...")
    deleted_count = cleanup_old_games()
    print(f"   Deleted {deleted_count} room(s)")

    # List rooms after cleanup
    print("\n6. Rooms AFTER cleanup:")
    rooms_after = list_all_rooms()

    # Verify results
    print("\n7. Verification:")
    expected_deleted = 3  # TEST_3HR, TEST_4HR, TEST_5HR
    expected_remaining = 3  # TEST_NEW, TEST_1HR, TEST_2HR

    if deleted_count == expected_deleted:
        print(f"   ✓ Correctly deleted {deleted_count} old rooms")
    else:
        print(f"   ✗ Expected to delete {expected_deleted} rooms, "
              f"but deleted {deleted_count}")

    if len(rooms_after) == expected_remaining:
        print(f"   ✓ Correctly kept {len(rooms_after)} recent rooms")
    else:
        print(f"   ✗ Expected {expected_remaining} rooms remaining, "
              f"but found {len(rooms_after)}")

    # Check which rooms remain
    remaining_codes = [r['room_code'] for r in rooms_after]
    expected_codes = ["TEST_NEW", "TEST_1HR", "TEST_2HR"]

    for code in expected_codes:
        if code in remaining_codes:
            print(f"   ✓ Room {code} correctly kept")
        else:
            print(f"   ✗ Room {code} was incorrectly deleted")

    # Clean up test data
    print("\n8. Cleaning up test data...")
    db.rooms.delete_many({"room_code": {"$regex": "^TEST"}})
    print("   Test data removed")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    run_manual_test()
