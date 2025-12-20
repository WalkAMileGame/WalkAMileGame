"""Tests for database initialization and connection"""
from unittest.mock import MagicMock, patch

from backend.app.db import initialize_database, db, client


class TestDatabaseInitialization:
    """Test suite for database initialization"""

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    @patch('builtins.print')
    def test_initialize_database_success(
            self, mock_print, mock_db, mock_client):
        """Test successful database initialization"""
        mock_client.admin.command.return_value = {'ok': 1}
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = ['points', 'boards']

        initialize_database()

        mock_client.admin.command.assert_called_once_with('ping')

        mock_print.assert_any_call(
            "Pinged your deployment. You successfully connected to MongoDB!")

        mock_db.points.update_one.assert_called_once_with(
            {"id": "0"},
            {"$set": {"values": 32}},
            upsert=True
        )

        mock_db.list_collection_names.assert_called_once()
        mock_print.assert_any_call("Collections in DB:", ['points', 'boards'])

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    @patch('builtins.print')
    def test_initialize_database_ping_failure(
            self, mock_print, mock_db, mock_client):
        """Test database initialization handles ping failure gracefully"""
        test_exception = Exception("Connection failed")
        mock_client.admin.command.side_effect = test_exception
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = []

        initialize_database()

        mock_print.assert_any_call(test_exception)

        mock_db.points.update_one.assert_called_once_with(
            {"id": "0"},
            {"$set": {"values": 32}},
            upsert=True
        )
        mock_db.list_collection_names.assert_called_once()

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    def test_initialize_database_sets_default_points_value(
            self, mock_db, mock_client):
        """Test that points are initialized with default value of 32"""
        mock_client.admin.command.return_value = {'ok': 1}
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = ['points']

        initialize_database()

        call_args = mock_db.points.update_one.call_args
        assert call_args[0][0] == {"id": "0"}, "Should query for id='0'"
        assert call_args[0][1] == {
            "$set": {"values": 32}}, "Should set values to 32"
        assert call_args[1]['upsert'] is True, "Should use upsert"

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    def test_initialize_database_uses_upsert(self, mock_db, mock_client):
        """Test that update_one uses upsert to create or update"""
        mock_client.admin.command.return_value = {'ok': 1}
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = ['points']

        initialize_database()

        _, kwargs = mock_db.points.update_one.call_args
        assert kwargs.get('upsert') is True

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    @patch('builtins.print')
    def test_initialize_database_lists_collections(
            self, mock_print, mock_db, mock_client):
        """Test that collections are listed and printed"""
        mock_client.admin.command.return_value = {'ok': 1}
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = [
            'points', 'boards', 'users']

        initialize_database()

        mock_db.list_collection_names.assert_called_once()

        mock_print.assert_any_call(
            "Collections in DB:", [
                'points', 'boards', 'users'])

    @patch('backend.app.db.client')
    @patch('backend.app.db.db')
    def test_initialize_database_continues_after_ping_error(
            self, mock_db, mock_client):
        """Test that initialization continues even if ping fails"""
        mock_client.admin.command.side_effect = Exception("Network timeout")
        mock_db.points.update_one.return_value = MagicMock(modified_count=1)
        mock_db.list_collection_names.return_value = ['points']

        initialize_database()

        assert mock_db.points.update_one.called
        assert mock_db.list_collection_names.called


class TestDatabaseModule:
    """Test module-level database setup"""

    def test_db_object_exists(self):
        """Test that db object is available"""
        assert db is not None

    def test_client_object_exists(self):
        """Test that client object is available"""
        assert client is not None
