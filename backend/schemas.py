from pydantic import BaseModel, EmailStr
from typing import Optional 

class UserCreate(BaseModel):
    email: EmailStr
    password: str

# 🔐 ROLE UPGRADE: Login response token payload metadata
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str       # "user" ya "admin"
    email: EmailStr
    username: str

# Ek single parking slot ka data kaisa dikhega
class ParkingSlotResponse(BaseModel):
    slot_id: str
    is_occupied: bool
    current_price: float
    booked_by: Optional[str] = None 
    is_ev_slot: bool = False