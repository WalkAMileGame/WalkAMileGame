""" backend/backend_tests/conftest.py """
from unittest.mock import MagicMock, patch

_MONGO_PATCHER = None


def pytest_configure(config):  # pylint: disable=unused-argument
    """Patch MongoDB before any test modules are imported"""
    global _MONGO_PATCHER  # pylint: disable=global-statement

    mock_client = MagicMock()
    mock_db = MagicMock()

    mock_client.get_database.return_value = mock_db
    mock_client.admin.command.return_value = None

    _MONGO_PATCHER = patch(
        'pymongo.mongo_client.MongoClient',
        return_value=mock_client)
    _MONGO_PATCHER.start()


def pytest_unconfigure(config):  # pylint: disable=unused-argument
    """Clean up the patch after all tests"""
    if _MONGO_PATCHER:
        _MONGO_PATCHER.stop()
