"""Integration tests for the cleanup scheduler"""
import os
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.app.cleanup import cleanup_old_games
from backend.main import app, scheduler


class TestSchedulerIntegration:
    """Test suite for scheduler integration"""

    @patch('backend.main.initialize_database')
    @patch('backend.main.create_cleanup_index')
    @patch('backend.main.scheduler')
    def test_scheduler_starts_on_app_startup(
            self, mock_scheduler, mock_create_index, mock_init_db):
        """Test that scheduler starts when app starts (non-testing mode)"""
        os.environ["TESTING"] = "false"

        # Mock scheduler behavior
        mock_scheduler.running = False

        with TestClient(app):
            # Verify scheduler.add_job was called
            assert mock_scheduler.add_job.called

            # Get the job configuration
            call_args = mock_scheduler.add_job.call_args

            # Verify cleanup function was registered
            cleanup_func = call_args[0][0]
            assert cleanup_func.__name__ == 'cleanup_old_games'

            # Verify interval is set correctly
            assert call_args[0][1] == 'interval'

            # Verify 2-hour interval
            kwargs = call_args[1]
            assert kwargs['hours'] == 2
            assert kwargs['id'] == 'cleanup_old_games'

            # Verify scheduler.start was called
            assert mock_scheduler.start.called

    @patch('backend.main.initialize_database')
    @patch('backend.main.create_cleanup_index')
    @patch('backend.main.scheduler')
    def test_scheduler_shuts_down_on_app_shutdown(
            self, mock_scheduler, mock_create_index, mock_init_db):
        """Test that scheduler shuts down when app stops"""

        # Mock scheduler as running
        mock_scheduler.running = True

        with TestClient(app):
            pass  # App starts and stops

        # Verify scheduler.shutdown was called
        assert mock_scheduler.shutdown.called

    @patch('backend.main.initialize_database')
    @patch('backend.main.create_cleanup_index')
    @patch('backend.main.cleanup_old_games')
    def test_cleanup_job_configuration(
            self, mock_cleanup, mock_create_index, mock_init_db):
        """Test that cleanup job is configured with correct parameters"""

        # Clear any existing jobs
        scheduler.remove_all_jobs()

        # Add the job (simulating app startup)
        scheduler.add_job(
            mock_cleanup,
            'interval',
            hours=2,
            id='cleanup_old_games',
            replace_existing=True
        )

        # Verify job exists
        jobs = scheduler.get_jobs()
        assert len(jobs) == 1

        job = jobs[0]
        assert job.id == 'cleanup_old_games'

        # Clean up
        scheduler.remove_all_jobs()


class TestSchedulerManualExecution:
    """Tests that simulate manual execution of scheduled tasks"""

    @patch('backend.app.cleanup.db')
    def test_manual_trigger_cleanup(self, mock_db):
        """Test manually triggering the cleanup function as scheduler would"""

        # Setup mock
        mock_result = MagicMock()
        mock_result.deleted_count = 10
        mock_db.rooms.delete_many.return_value = mock_result

        # Manually call the function (as scheduler would)
        result = cleanup_old_games()

        # Verify it executed
        assert result == 10
        assert mock_db.rooms.delete_many.called

    @patch('backend.app.cleanup.db')
    def test_rapid_consecutive_cleanups(self, mock_db):
        """Test that cleanup can be called multiple times in succession"""

        mock_result = MagicMock()
        mock_result.deleted_count = 1
        mock_db.rooms.delete_many.return_value = mock_result

        # Call cleanup multiple times rapidly
        results = []
        for _ in range(3):
            results.append(cleanup_old_games())
            time.sleep(0.01)  # Small delay

        # All should succeed
        assert all(r == 1 for r in results)
        assert mock_db.rooms.delete_many.call_count == 3
