from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from database import user_collection, slot_collection
from schemas import UserCreate, Token, ParkingSlotResponse
from auth import get_password_hash, verify_password, create_access_token
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
import joblib
import os

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "pricing_model.pkl")
try:
    pricing_model = joblib.load(MODEL_PATH)
    print("✅ ML Engine Status: Pricing model loaded successfully!")
except Exception as e:
    pricing_model = None
    print(f"⚠️ ML Engine Status: Model missing or failed to load ({e}). Using baseline fallback.")

class BookingRequest(BaseModel):
    userEmail: EmailStr

class DynamicUserCreate(UserCreate):
    username: Optional[str] = None 

def calculate_live_price(slot_id: str, occupancy_pct: float) -> float:
    now = datetime.now()
    current_hour = now.hour
    current_day = now.weekday()
    
    if pricing_model:
        predicted_base = pricing_model.predict([[current_hour, current_day, occupancy_pct]])[0]
        dynamic_normal_price = round(float(predicted_base), 2)
    else:
        dynamic_normal_price = 50.0
        
    slot_num = int(''.join(filter(str.isdigit, slot_id)))
    is_ev = slot_num % 5 == 0
    return round(dynamic_normal_price * 1.3, 2) if is_ev else dynamic_normal_price

# -----------------------------

@app.post("/api/auth/signup")
async def signup(user: DynamicUserCreate):
    existing_user = await user_collection.find_one({"email": user.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered!")
    
    hashed_password = get_password_hash(user.password)
    
  
    final_username = user.username if user.username else user.email.split('@')[0].capitalize()

    new_user = {
        "email": user.email.lower(), 
        "username": final_username.strip(), 
        "password": hashed_password,
        "wallet_balance": 500.0,
        "role": "user"
    }
    
    await user_collection.insert_one(new_user)
    return {"status": "Success", "message": "User registered successfully with ₹500 wallet balance!"}


@app.post("/api/auth/login", response_model=Token)
async def login(user: UserCreate):
    email_clean = user.email.lower()
    db_user = await user_collection.find_one({"email": email_clean})
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid Credentials (Wrong Email)")
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid Credentials (Wrong Password)")
    
    user_role = db_user.get("role", "user")
    
   
    username_display = db_user.get("username", email_clean.split('@')[0].capitalize())
    
    access_token = create_access_token(data={"sub": email_clean, "role": user_role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user_role,
        "email": db_user["email"],
        "username": username_display
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Parking Backend API Docs. Go to /docs to test APIs!"}


@app.get("/api/user/wallet/{email}")
async def get_wallet_balance(email: str):
    user = await user_collection.find_one({"email": email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User target space missing.")
    return {"wallet_balance": round(user.get("wallet_balance", 0.0), 2)}


@app.get("/api/slots")
async def get_all_slots():
    slots = []
    cursor = slot_collection.find({})
    
    async for document in cursor:
        slots.append(document)
        
    total_slots = len(slots)
    occupied_slots = sum(1 for s in slots if s.get("is_occupied") == True)
    occupancy_pct = (occupied_slots / total_slots) * 100 if total_slots > 0 else 0
    
    now = datetime.now()
    current_hour = now.hour
    current_day = now.weekday()
    
    if pricing_model:
        predicted_base = pricing_model.predict([[current_hour, current_day, occupancy_pct]])[0]
        dynamic_normal_price = round(float(predicted_base), 2)
    else:
        dynamic_normal_price = 50.0
        
    dynamic_ev_price = round(dynamic_normal_price * 1.3, 2)

    response_slots = []
    for document in slots:
        slot_id = document["slot_id"]
        slot_num = int(''.join(filter(str.isdigit, slot_id)))
        is_ev = slot_num % 5 == 0
        
        assigned_price = dynamic_ev_price if is_ev else dynamic_normal_price
        is_occupied = document["is_occupied"]
        
        response_slots.append({
            "slot_id": slot_id,
            "is_occupied": is_occupied,
            "current_price": assigned_price,
            "is_ev": is_ev,
            "booked_by": "LOCKED" if is_occupied else None
        })
        
    return {
        "occupancy_percentage": occupancy_pct,
        "slots": response_slots
    }


@app.post("/api/slots/book/{slot_id}")
async def book_slot(slot_id: str, payload: BookingRequest):
    slot = await slot_collection.find_one({"slot_id": slot_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Didn't get the parking slot!")
        
    if slot["is_occupied"]:
        raise HTTPException(status_code=400, detail="This slot is already booked!")
    
    user = await user_collection.find_one({"email": payload.userEmail.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User account signature not found!")

    all_slots_count = await slot_collection.count_documents({})
    occupied_slots_count = await slot_collection.count_documents({"is_occupied": True})
    current_occupancy_pct = (occupied_slots_count / all_slots_count) * 100 if all_slots_count > 0 else 0
    
    charged_amount = calculate_live_price(slot_id, current_occupancy_pct)
    current_user_balance = user.get("wallet_balance", 0.0)

    if current_user_balance < charged_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient Wallet Balance! Required: ₹{charged_amount}, Available: ₹{current_user_balance}"
        )

    wallet_deduction_result = await user_collection.update_one(
        {"email": payload.userEmail.lower(), "wallet_balance": {"$gte": charged_amount}},
        {"$inc": {"wallet_balance": -charged_amount}}
    )
    
    if wallet_deduction_result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Payment transaction handling failure. Try again.")

    result = await slot_collection.update_one(
        {"slot_id": slot_id, "is_occupied": False},
        {"$set": {"is_occupied": True, "booked_by": payload.userEmail.lower(), "booked_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        await user_collection.update_one({"email": payload.userEmail.lower()}, {"$inc": {"wallet_balance": charged_amount}})
        raise HTTPException(status_code=400, detail="Booking transaction conflict occurred. Funds rolled back.")
        
    return {
        "status": "Success", 
        "message": f"Slot {slot_id} secured! ₹{charged_amount} deducted from your wallet."
    }


@app.post("/api/slots/checkout/{slot_id}")
async def checkout_slot(slot_id: str):
    slot = await slot_collection.find_one({"slot_id": slot_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Didn't get the parking slot!")
        
    if not slot["is_occupied"]:
        raise HTTPException(status_code=400, detail="This slot is already empty/free!")
    
    result = await slot_collection.update_one(
        {"slot_id": slot_id, "is_occupied": True},
        {"$set": {"is_occupied": False, "booked_by": None}, "$unset": {"booked_at": ""}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Checkout processing error or slot state conflict.")
        
    return {"status": "Success", "message": f"Slot {slot_id} is now free and open for booking!"}


@app.get("/api/admin/analytics")
async def get_admin_analytics():
    hourly_data = [
        {"hour": "00:00", "revenue": 120}, {"hour": "03:00", "revenue": 50},
        {"hour": "06:00", "revenue": 90},  {"hour": "09:00", "revenue": 650},
        {"hour": "12:00", "revenue": 480}, {"hour": "15:00", "revenue": 390},
        {"hour": "18:00", "revenue": 820}, {"hour": "21:00", "revenue": 450}
    ]
    
    weekly_occupancy = [
        {"day": "Mon", "occupancy": 75}, {"day": "Tue", "occupancy": 82},
        {"day": "Wed", "occupancy": 80}, {"day": "Thu", "occupancy": 88},
        {"day": "Fri", "occupancy": 95}, {"day": "Sat", "occupancy": 60},
        {"day": "Sun", "occupancy": 45}
    ]

    total_slots = await slot_collection.count_documents({})
    occupied_slots = await slot_collection.count_documents({"is_occupied": True})
    
    ev_share = {
        "labels": ["EV Charging Spaces", "Normal Parking Spaces"],
        "data": [35, 65]
    }
    
    return {
        "hourly_revenue": hourly_data,
        "weekly_occupancy": weekly_occupancy,
        "ev_distribution": ev_share,
        "summary_metrics": {
            "total_matrix_slots": total_slots,
            "live_active_occupancy": occupied_slots,
        }
    }
