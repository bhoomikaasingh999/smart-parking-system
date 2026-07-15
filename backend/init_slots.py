import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()
mongo_details = os.getenv("MONGO_DETAILS")
client = motor.motor_asyncio.AsyncIOMotorClient(mongo_details)
database = client.smart_parking
slot_collection = database.get_collection("slots_collection")

async def create_initial_slots():
    await slot_collection.delete_many({})
    
    initial_slots = []
    for i in range(1, 11):
        if i >= 9:
            is_ev = True
            price = 65.0 
        else:
            is_ev = False
            price = 50.0
        slot = {
            "slot_id": f"A{i}",
            "is_occupied": False,
            "current_price": price,
            "booked_by": None,
            "is_ev_slot": is_ev
           
        }
        initial_slots.append(slot)
    
    await slot_collection.insert_many(initial_slots)
    print("10 Parking Slots successfully initialized in Database! 🚗💨")
    
if __name__ == "__main__":
    asyncio.run(create_initial_slots())