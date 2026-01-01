from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional
import re

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8, max_length=100)
    role: str
    
    @validator('name')
    def validate_name(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        # Remove spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        
        # Extract only digits
        digits = ''.join(filter(str.isdigit, cleaned))
        
        # Check length
        if len(digits) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        if len(digits) > 15:
            raise ValueError('Phone number too long')
        
        return cleaned  # Return cleaned version
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in v)
        has_number = any(c.isdigit() for c in v)
        
        if not (has_letter and has_number):
            raise ValueError('Password must contain both letters and numbers')
        
        return v
    
    @validator('role')
    def validate_role(cls, v):
        v = v.lower().strip()
        if v not in ['driver', 'mechanic']:
            raise ValueError('Role must be "driver" or "mechanic"')
        return v

class RequestCreate(BaseModel):
    vehicle_type: str
    problem_desc: str = Field(..., min_length=5, max_length=500)
    lat: float
    lng: float
    
    @validator('vehicle_type')
    def validate_vehicle_type(cls, v):
        v = v.lower().strip()
        if v not in ['car', 'bike', 'truck']:
            raise ValueError('Vehicle type must be car, bike, or truck')
        return v
    
    @validator('lat')
    def validate_latitude(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError('Invalid latitude')
        if v == 0.0:
            raise ValueError('Location not detected')
        return v
    
    @validator('lng')
    def validate_longitude(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError('Invalid longitude')
        if v == 0.0:
            raise ValueError('Location not detected')
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_available: bool

    class Config:
        from_attributes = True

class RequestResponse(BaseModel):
    id: int
    customer_id: int
    mechanic_id: Optional[int] = None
    vehicle_type: str
    problem_desc: str
    lat: float
    lng: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MechanicInfo(BaseModel):
    id: int
    name: str
    phone: str

class RequestWithMechanic(RequestResponse):
    mechanic: Optional[MechanicInfo] = None
