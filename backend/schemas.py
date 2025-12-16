from pydantic import BaseModel,EmailStr
from typing import Optional
from datetime import datetime

class RequestCreate(BaseModel):
    vehicle_type:str
    problem_desc:str
    lat:float
    lng:float

class MechanicInfo(BaseModel):
    id: int
    name: str
    phone: str
    
    class Config:
        from_attributes = True

class RequestResponse(RequestCreate):
    id:int
    customer_id:int
    mechanic_id: Optional[int] = None
    status:str
    created_at:datetime
    
class RequestWithMechanic(RequestResponse):
    mechanic: Optional[MechanicInfo] = None

class UserBase(BaseModel):
    name:str
    email:EmailStr
    phone:str
    role:str="user"
    
class UserCreate(UserBase):
 password:str
 
class UserResponse(UserBase):
    id:int
    is_available:bool
    
    class Config:
        from_attributes=True 
        populate_by_name = True   
    