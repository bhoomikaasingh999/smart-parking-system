import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb+srv://bhoomikasingh4926_db_user:Bhoomika$&!!444@mycluster.kiizfjr.mongodb.net/?appName=mycluster"
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.smart_parking
slot_collection = database.get_collection("slots")

async def seed_slots():
    
    await slot_collection.delete_many({})
    
    dummy_slots = []
    
    for i in range(1, 31):
        slot_id = f"A{i}"
        
        #
        is_ev = (i % 5 == 0)
        price = 65 if is_ev else 50
        
        slot_data = {
            "slot_id": slot_id,
            "is_occupied": False,
            "current_price": price,
            "is_ev": is_ev,
            "booked_by": None
        }
        

        if slot_id in ["A4", "A12", "A25"]:
            slot_data["is_occupied"] = True
            slot_data["booked_by"] = "parked_user@gmail.com"
            
        dummy_slots.append(slot_data)
        
    await slot_collection.insert_many(dummy_slots)
    print("30 Live Parking Slots injected into MongoDB!")

if __name__ == "__main__":
    asyncio.run(seed_slots())
