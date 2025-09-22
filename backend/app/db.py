"""backend code that handles the mongo database"""
from os import getenv
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()
uri = getenv("MONGO_URI")
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
db = client.get_database()

def initialize_database():
    """Call this function when you initialize the database"""
    # Wrapped in function to prevent database operations during module import,
    # was causing issues with testing -ed
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    db.points.update_one({"id":"0"}, {"$set": {"values": 32}}, upsert=True)
    collections = db.list_collection_names()
    print("Collections in DB:", collections)
