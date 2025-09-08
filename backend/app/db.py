from dotenv import load_dotenv
from os import getenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()
uri = getenv("MONGO_URI")
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
db = client.get_database()
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    

db.points.insert_one({"id": "0", "values": 32})
collections = db.list_collection_names()
print("Collections in DB:", collections)
#output: Collections in DB: ['users', 'movies', 'embedded_movies', 'points', 'comments', 'theaters', 'sessions'] <-- nää postetaan jossainvaiheessa.