from pydantic import BaseModel, EmailStr
from typing import Optional 

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str      
    email: EmailStr
    username: str

class ParkingSlotResponse(BaseModel):
    slot_id: str
    is_occupied: bool
    current_price: float
    booked_by: Optional[str] = None 
    is_ev_slot: bool = False
