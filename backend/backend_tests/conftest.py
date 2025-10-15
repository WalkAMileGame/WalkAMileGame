# backend/backend_tests/conftest.py
from unittest.mock import MagicMock, patch

# This runs BEFORE any test collection or imports
_mongo_patcher = None

def pytest_configure(config):
    """Patch MongoDB before any test modules are imported"""
    global _mongo_patcher
    
    # Create a mock client that won't create real connections
    mock_client = MagicMock()
    mock_db = MagicMock()
    
    mock_client.get_database.return_value = mock_db
    mock_client.admin.command.return_value = None
    
    # Patch MongoClient globally
    _mongo_patcher = patch('pymongo.mongo_client.MongoClient', return_value=mock_client)
    _mongo_patcher.start()

def pytest_unconfigure(config):
    """Clean up the patch after all tests"""
    global _mongo_patcher
    if _mongo_patcher:
        _mongo_patcher.stop()
