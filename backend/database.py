import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()
mongo_details = os.getenv("MONGO_DETAILS")


client = motor.motor_asyncio.AsyncIOMotorClient(mongo_details)


database = client.smart_parking


user_collection = database.get_collection("users_collection")
slot_collection = database.get_collection("slots_collection")