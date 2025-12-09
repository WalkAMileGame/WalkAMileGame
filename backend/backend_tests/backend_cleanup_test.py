"""Tests for database cleanup functionality"""
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta

import pytest

from backend.app.cleanup import cleanup_old_games, create_cleanup_index


class TestCleanupOldGames:
    """Test suite for cleanup_old_games function"""

    @patch('backend.app.cleanup.db')
    def test_cleanup_deletes_old_games(self, mock_db):
        """Test that games older than 3 hours are deleted"""
        # Setup mock
        mock_result = MagicMock()
        mock_result.deleted_count = 5
        mock_db.rooms.delete_many.return_value = mock_result

        # Run cleanup
        deleted = cleanup_old_games()

        # Verify delete_many was called
        assert mock_db.rooms.delete_many.called
        assert deleted == 5

        # Verify the query structure
        call_args = mock_db.rooms.delete_many.call_args
        query = call_args[0][0]

        # Check that query looks for game_started_at that is not None
        assert "game_started_at" in query
        assert "$ne" in query["game_started_at"]
        assert query["game_started_at"]["$ne"] is None

        # Check that query filters by time (cutoff should be 3 hours ago)
        assert "$lt" in query["game_started_at"]

    @patch('backend.app.cleanup.db')
    def test_cleanup_uses_correct_cutoff_time(self, mock_db):
        """Test that cleanup uses 3-hour cutoff time"""
        mock_result = MagicMock()
        mock_result.deleted_count = 2
        mock_db.rooms.delete_many.return_value = mock_result

        # Capture current time before cleanup
        before_cleanup = datetime.now(timezone.utc)
        cleanup_old_games()
        after_cleanup = datetime.now(timezone.utc)

        # Get the query that was used
        call_args = mock_db.rooms.delete_many.call_args
        query = call_args[0][0]
        cutoff_iso = query["game_started_at"]["$lt"]

        # Parse the cutoff time
        cutoff_time = datetime.fromisoformat(cutoff_iso)

        # Expected cutoff should be approximately 3 hours before current time
        expected_cutoff_min = before_cleanup - timedelta(hours=3, minutes=1)
        expected_cutoff_max = after_cleanup - timedelta(hours=3)

        assert expected_cutoff_min <= cutoff_time <= expected_cutoff_max

    @patch('backend.app.cleanup.db')
    def test_cleanup_returns_zero_when_no_games_deleted(self, mock_db):
        """Test that cleanup returns 0 when no games are deleted"""
        mock_result = MagicMock()
        mock_result.deleted_count = 0
        mock_db.rooms.delete_many.return_value = mock_result

        deleted = cleanup_old_games()

        assert deleted == 0
        assert mock_db.rooms.delete_many.called

    @patch('backend.app.cleanup.db')
    @patch('backend.app.cleanup.logger')
    def test_cleanup_logs_deletion_count(self, mock_logger, mock_db):
        """Test that cleanup logs the number of deleted games"""
        mock_result = MagicMock()
        mock_result.deleted_count = 3
        mock_db.rooms.delete_many.return_value = mock_result

        cleanup_old_games()

        # Should log info message with count
        mock_logger.info.assert_called_once()
        log_message = mock_logger.info.call_args[0][0]
        assert "3" in log_message
        assert "game room" in log_message.lower()

    @patch('backend.app.cleanup.db')
    @patch('backend.app.cleanup.logger')
    def test_cleanup_logs_debug_when_nothing_deleted(
            self, mock_logger, mock_db):
        """Test that cleanup logs debug message when nothing is deleted"""
        mock_result = MagicMock()
        mock_result.deleted_count = 0
        mock_db.rooms.delete_many.return_value = mock_result

        cleanup_old_games()

        # Should log debug message
        mock_logger.debug.assert_called_once()
        log_message = mock_logger.debug.call_args[0][0]
        assert "no old game rooms" in log_message.lower()

    @patch('backend.app.cleanup.db')
    @patch('backend.app.cleanup.logger')
    def test_cleanup_handles_exceptions(self, mock_logger, mock_db):
        """Test that cleanup handles database exceptions gracefully"""
        mock_db.rooms.delete_many.side_effect = Exception(
            "Database connection error")

        deleted = cleanup_old_games()

        # Should return 0 and log error
        assert deleted == 0
        mock_logger.error.assert_called_once()
        log_message = mock_logger.error.call_args[0][0]
        assert "error" in log_message.lower()

    @patch('backend.app.cleanup.db')
    def test_cleanup_query_format(self, mock_db):
        """Test that the MongoDB query has the correct structure"""
        mock_result = MagicMock()
        mock_result.deleted_count = 1
        mock_db.rooms.delete_many.return_value = mock_result

        cleanup_old_games()

        # Get the query
        query = mock_db.rooms.delete_many.call_args[0][0]

        # Verify query structure matches MongoDB syntax
        assert isinstance(query, dict)
        assert "game_started_at" in query
        assert isinstance(query["game_started_at"], dict)
        assert "$ne" in query["game_started_at"]
        assert "$lt" in query["game_started_at"]


class TestCreateCleanupIndex:
    """Test suite for create_cleanup_index function"""

    @patch('backend.app.cleanup.db')
    @patch('backend.app.cleanup.logger')
    def test_create_index_success(self, mock_logger, mock_db):
        """Test that index creation succeeds"""
        mock_db.rooms.create_index.return_value = "game_started_at_1"

        create_cleanup_index()

        # Verify index creation was called with correct parameters
        mock_db.rooms.create_index.assert_called_once_with(
            "game_started_at",
            sparse=True
        )

        # Verify success was logged
        mock_logger.info.assert_called_once()
        log_message = mock_logger.info.call_args[0][0]
        assert "index" in log_message.lower()
        assert "game_started_at" in log_message

    @patch('backend.app.cleanup.db')
    @patch('backend.app.cleanup.logger')
    def test_create_index_handles_exception(self, mock_logger, mock_db):
        """Test that index creation handles exceptions gracefully"""
        mock_db.rooms.create_index.side_effect = Exception(
            "Index already exists")

        create_cleanup_index()

        # Should log warning, not crash
        mock_logger.warning.assert_called_once()
        log_message = mock_logger.warning.call_args[0][0]
        assert "index" in log_message.lower()

    @patch('backend.app.cleanup.db')
    def test_create_index_uses_sparse_option(self, mock_db):
        """Test that index is created with sparse=True option"""
        create_cleanup_index()

        # Get the call arguments
        call_args = mock_db.rooms.create_index.call_args

        # Check sparse parameter
        assert call_args[1]['sparse'] is True
