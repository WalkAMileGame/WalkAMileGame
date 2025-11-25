"""Tests for room management endpoints"""
import os
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from datetime import datetime, timezone

os.environ['TESTING'] = 'true'

# Create a test app
app = FastAPI()

# Mock the database before importing router
with patch("backend.app.api.db") as mock_db:
    from backend.app.api import router
    app.include_router(router)

client = TestClient(app)


# Room Creation Tests

@patch('backend.app.api.db')
def test_create_room_success(mock_db_instance):
    """Test successfully creating a new room"""
    mock_db_instance.rooms.find_one.return_value = None
    mock_db_instance.rooms.insert_one.return_value = MagicMock()

    response = client.post("/rooms/create", json={
        "room_code": "ABC123",
        "gamemaster_name": "TestGM",
        "board_config": {"name": "Test Board", "ringData": []},
        "time_remaining": 30,
        "teams": [],
        "game_started": False
    })

    assert response.status_code == 200
    assert response.json() == {
        "message": "Room created successfully",
        "room_code": "ABC123"
    }
    mock_db_instance.rooms.find_one.assert_called_once_with({"room_code": "ABC123"})


@patch('backend.app.api.db')
def test_create_room_duplicate_code(mock_db_instance):
    """Test creating a room with an existing room code"""
    mock_db_instance.rooms.find_one.return_value = {"room_code": "ABC123"}

    response = client.post("/rooms/create", json={
        "room_code": "ABC123",
        "gamemaster_name": "TestGM",
        "board_config": {"name": "Test Board", "ringData": []},
        "time_remaining": 30,
        "teams": [],
        "game_started": False
    })

    assert response.status_code == 400
    assert response.json()["detail"] == "Room with this code already exists"


@patch('backend.app.api.db')
def test_create_room_case_insensitive(mock_db_instance):
    """Test that room codes are case-insensitive"""
    mock_db_instance.rooms.find_one.return_value = None
    mock_db_instance.rooms.insert_one.return_value = MagicMock()

    response = client.post("/rooms/create", json={
        "room_code": "abc123",
        "gamemaster_name": "TestGM",
        "board_config": {"name": "Test Board", "ringData": []},
        "time_remaining": 30,
        "teams": [],
        "game_started": False
    })

    assert response.status_code == 200
    assert response.json()["room_code"] == "ABC123"
    mock_db_instance.rooms.find_one.assert_called_once_with({"room_code": "ABC123"})


# Room Retrieval Tests

@patch('backend.app.api.db')
def test_get_room_success(mock_db_instance):
    """Test successfully retrieving a room"""
    mock_room = {
        "room_code": "ABC123",
        "gamemaster_name": "TestGM",
        "board_config": {"name": "Test Board"},
        "teams": [],
        "time_remaining": 30,
        "game_started": False
    }
    mock_db_instance.rooms.find_one.return_value = mock_room

    response = client.get("/rooms/ABC123")

    assert response.status_code == 200
    assert response.json() == mock_room


@patch('backend.app.api.db')
def test_get_room_not_found(mock_db_instance):
    """Test retrieving a non-existent room"""
    mock_db_instance.rooms.find_one.return_value = None

    response = client.get("/rooms/INVALID")

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


# Team Management Tests

@patch('backend.app.api.db')
def test_add_team_success(mock_db_instance):
    """Test successfully adding a team to a room"""
    mock_db_instance.rooms.find_one.return_value = {
        "room_code": "ABC123",
        "teams": []
    }
    mock_db_instance.rooms.update_one.return_value = MagicMock()

    response = client.post("/rooms/ABC123/teams", json={
        "id": 1,
        "team_name": "Team Alpha",
        "circumstance": "Test circumstance",
        "current_energy": 100,
        "gameboard_state": {
            "id": 1,
            "innerRadius": 100,
            "outerRadius": 200,
            "labels": []
        }
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Team added successfully"


@patch('backend.app.api.db')
def test_add_team_duplicate_name(mock_db_instance):
    """Test adding a team with a duplicate name"""
    mock_db_instance.rooms.find_one.return_value = {
        "room_code": "ABC123",
        "teams": [{"team_name": "Team Alpha"}]
    }

    response = client.post("/rooms/ABC123/teams", json={
        "id": 1,
        "team_name": "Team Alpha",
        "circumstance": "Test",
        "current_energy": 100,
        "gameboard_state": {
            "id": 1,
            "innerRadius": 100,
            "outerRadius": 200,
            "labels": []
        }
    })

    assert response.status_code == 400
    assert response.json()["detail"] == "Team name already exists"


@patch('backend.app.api.db')
def test_add_team_room_not_found(mock_db_instance):
    """Test adding a team to a non-existent room"""
    mock_db_instance.rooms.find_one.return_value = None

    response = client.post("/rooms/INVALID/teams", json={
        "id": 1,
        "team_name": "Team Alpha",
        "circumstance": "Test",
        "current_energy": 100,
        "gameboard_state": {
            "id": 1,
            "innerRadius": 100,
            "outerRadius": 200,
            "labels": []
        }
    })

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


@patch('backend.app.api.db')
def test_delete_team_success(mock_db_instance):
    """Test successfully deleting a team"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(modified_count=1)

    response = client.delete("/rooms/ABC123/teams/Team Alpha")

    assert response.status_code == 200
    assert response.json()["message"] == "Team deleted successfully"


@patch('backend.app.api.db')
def test_delete_team_not_found(mock_db_instance):
    """Test deleting a non-existent team"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(modified_count=0)

    response = client.delete("/rooms/ABC123/teams/NonExistent")

    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


@patch('backend.app.api.db')
def test_update_team_circumstance_success(mock_db_instance):
    """Test successfully updating a team's circumstance"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.put("/rooms/ABC123/teams/Team Alpha/circumstance", json={
        "circumstance": "New circumstance"
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Circumstance updated successfully"


@patch('backend.app.api.db')
def test_update_team_circumstance_not_found(mock_db_instance):
    """Test updating circumstance for non-existent room/team"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=0)

    response = client.put("/rooms/INVALID/teams/Team Alpha/circumstance", json={
        "circumstance": "New circumstance"
    })

    assert response.status_code == 404
    assert response.json()["detail"] == "Room or team not found"


# Game Control Tests

@patch('backend.app.api.db')
def test_start_game_success(mock_db_instance):
    """Test successfully starting a game"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.post("/rooms/ABC123/start")

    assert response.status_code == 200
    assert response.json()["message"] == "Game started successfully"

    # Verify update call includes game_started and game_started_at
    call_args = mock_db_instance.rooms.update_one.call_args
    assert call_args[0][0] == {"room_code": "ABC123"}
    assert call_args[0][1]["$set"]["game_started"] == True
    assert "game_started_at" in call_args[0][1]["$set"]


@patch('backend.app.api.db')
def test_start_game_room_not_found(mock_db_instance):
    """Test starting a non-existent game"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=0)

    response = client.post("/rooms/INVALID/start")

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


@patch('backend.app.api.db')
def test_pause_game_success(mock_db_instance):
    """Test successfully pausing a game"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.post("/rooms/ABC123/pause")

    assert response.status_code == 200
    assert response.json()["message"] == "Game paused successfully"


@patch('backend.app.api.db')
def test_resume_game_success(mock_db_instance):
    """Test successfully resuming a game"""
    mock_room = {
        "room_code": "ABC123",
        "game_paused": True,
        "paused_at": datetime.now(timezone.utc).isoformat(),
        "accumulated_pause_time": 0
    }
    mock_db_instance.rooms.find_one.return_value = mock_room
    mock_db_instance.rooms.update_one.return_value = MagicMock()

    response = client.post("/rooms/ABC123/resume")

    assert response.status_code == 200
    assert response.json()["message"] == "Game resumed successfully"


@patch('backend.app.api.db')
def test_resume_game_accumulates_pause_time(mock_db_instance):
    """Test that resume correctly calculates accumulated pause time"""
    # Create a mock room that was paused 10 seconds ago
    paused_time = datetime.now(timezone.utc)
    mock_room = {
        "room_code": "ABC123",
        "game_paused": True,
        "paused_at": paused_time.isoformat(),
        "accumulated_pause_time": 5
    }
    mock_db_instance.rooms.find_one.return_value = mock_room
    mock_db_instance.rooms.update_one.return_value = MagicMock()

    response = client.post("/rooms/ABC123/resume")

    assert response.status_code == 200

    # Verify accumulated_pause_time was updated
    call_args = mock_db_instance.rooms.update_one.call_args
    assert "accumulated_pause_time" in call_args[0][1]["$set"]
    # Should be at least 5 (previous) + some seconds
    assert call_args[0][1]["$set"]["accumulated_pause_time"] >= 5


@patch('backend.app.api.db')
def test_end_game_success(mock_db_instance):
    """Test successfully ending a game"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.post("/rooms/ABC123/end")

    assert response.status_code == 200
    assert response.json()["message"] == "Game ended successfully"


# Time Management Tests

@patch('backend.app.api.db')
def test_update_time_without_reset(mock_db_instance):
    """Test updating time without resetting timer"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.post("/rooms/ABC123/time", json={
        "time_remaining": 45,
        "reset_timer": False
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Time updated successfully"

    # Verify only time_remaining was updated
    call_args = mock_db_instance.rooms.update_one.call_args
    update_fields = call_args[0][1]["$set"]
    assert update_fields["time_remaining"] == 45
    assert "game_started_at" not in update_fields


@patch('backend.app.api.db')
def test_update_time_with_reset(mock_db_instance):
    """Test updating time with timer reset"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.post("/rooms/ABC123/time", json={
        "time_remaining": 45,
        "reset_timer": True
    })

    assert response.status_code == 200

    # Verify timer fields were reset
    call_args = mock_db_instance.rooms.update_one.call_args
    update_fields = call_args[0][1]["$set"]
    assert update_fields["time_remaining"] == 45
    assert "game_started_at" in update_fields
    assert update_fields["accumulated_pause_time"] == 0
    assert update_fields["paused_at"] is None
    assert update_fields["game_paused"] == False


@patch('backend.app.api.db')
def test_update_time_room_not_found(mock_db_instance):
    """Test updating time for non-existent room"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=0)

    response = client.post("/rooms/INVALID/time", json={
        "time_remaining": 45,
        "reset_timer": False
    })

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


# Team Board Tests

@patch('backend.app.api.db')
def test_get_team_board_success(mock_db_instance):
    """Test successfully retrieving a team's board"""
    mock_room = {
        "room_code": "ABC123",
        "teams": [{
            "team_name": "Team Alpha",
            "gameboard_state": {"ringData": [{"id": 1}]}
        }]
    }
    mock_db_instance.rooms.find_one.return_value = mock_room

    response = client.get("/rooms/ABC123/teams/Team Alpha/board")

    assert response.status_code == 200
    assert response.json() == {"ringData": [{"id": 1}]}


@patch('backend.app.api.db')
def test_get_team_board_room_not_found(mock_db_instance):
    """Test retrieving board for non-existent room"""
    mock_db_instance.rooms.find_one.return_value = None

    response = client.get("/rooms/INVALID/teams/Team Alpha/board")

    assert response.status_code == 404
    assert response.json()["detail"] == "Room not found"


@patch('backend.app.api.db')
def test_get_team_board_team_not_found(mock_db_instance):
    """Test retrieving board for non-existent team"""
    mock_room = {"room_code": "ABC123", "teams": []}
    mock_db_instance.rooms.find_one.return_value = mock_room

    response = client.get("/rooms/ABC123/teams/NonExistent/board")

    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


@patch('backend.app.api.db')
def test_update_team_board_success(mock_db_instance):
    """Test successfully updating a team's board"""
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.put("/rooms/ABC123/teams/Team Alpha/board", json={
        "board_state": {"ringData": [{"id": 1, "updated": True}]}
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Board updated successfully"


# Team Energy Tests

@patch('backend.app.api.db')
def test_get_team_energy_success(mock_db_instance):
    """Test successfully retrieving a team's energy"""
    mock_room = {
        "room_code": "ABC123",
        "teams": [{
            "team_name": "Team Alpha",
            "current_energy": 75
        }]
    }
    mock_db_instance.rooms.find_one.return_value = mock_room

    response = client.get("/rooms/ABC123/teams/Team Alpha/energy")

    assert response.status_code == 200
    assert response.json() == {"current_energy": 75}


@patch('backend.app.api.db')
def test_update_team_energy_increase(mock_db_instance):
    """Test increasing a team's energy"""
    mock_room = {
        "room_code": "ABC123",
        "teams": [{
            "team_name": "Team Alpha",
            "current_energy": 50
        }]
    }
    mock_db_instance.rooms.find_one.return_value = mock_room
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.put("/rooms/ABC123/teams/Team Alpha/energy", json={
        "change": 25
    })

    assert response.status_code == 200
    assert response.json()["current_energy"] == 75


@patch('backend.app.api.db')
def test_update_team_energy_decrease(mock_db_instance):
    """Test decreasing a team's energy"""
    mock_room = {
        "room_code": "ABC123",
        "teams": [{
            "team_name": "Team Alpha",
            "current_energy": 50
        }]
    }
    mock_db_instance.rooms.find_one.return_value = mock_room
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.put("/rooms/ABC123/teams/Team Alpha/energy", json={
        "change": -20
    })

    assert response.status_code == 200
    assert response.json()["current_energy"] == 30


@patch('backend.app.api.db')
def test_update_team_energy_cannot_go_negative(mock_db_instance):
    """Test that energy cannot go below zero"""
    mock_room = {
        "room_code": "ABC123",
        "teams": [{
            "team_name": "Team Alpha",
            "current_energy": 10
        }]
    }
    mock_db_instance.rooms.find_one.return_value = mock_room
    mock_db_instance.rooms.update_one.return_value = MagicMock(matched_count=1)

    response = client.put("/rooms/ABC123/teams/Team Alpha/energy", json={
        "change": -50
    })

    assert response.status_code == 200
    assert response.json()["current_energy"] == 0


@patch('backend.app.api.db')
def test_update_team_energy_team_not_found(mock_db_instance):
    """Test updating energy for non-existent team"""
    mock_room = {"room_code": "ABC123", "teams": []}
    mock_db_instance.rooms.find_one.return_value = mock_room

    response = client.put("/rooms/ABC123/teams/NonExistent/energy", json={
        "change": 10
    })

    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"
