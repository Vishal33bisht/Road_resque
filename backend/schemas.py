from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re


def validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters')
    if not any(char.isdigit() for char in v):
        raise ValueError('Password must contain at least one digit')
    if not any(char.isupper() for char in v):
        raise ValueError('Password must contain at least one uppercase letter')
    return v


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=8)
    role: str

    @field_validator('phone', mode='before')
    @classmethod
    def normalize_phone(cls, v):
        value = str(v).strip()
        digits = re.sub(r'\D', '', value)
        normalized = f"+{digits}" if value.startswith("+") else digits

        if not re.fullmatch(r'\+?\d{9,15}', normalized):
            raise ValueError('Phone number must contain 9 to 15 digits')

        return normalized
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        value = v.lower().strip()
        if value not in ['user', 'mechanic']:
            raise ValueError('Role must be user or mechanic')
        return value

class RequestCreate(BaseModel):
    vehicle_type: str
    problem_desc: str = Field(..., min_length=10, max_length=500)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    
    @field_validator('vehicle_type')
    @classmethod
    def validate_vehicle_type(cls, v):
        v = v.lower().strip()
        if v not in ['car', 'bike', 'truck']:
            raise ValueError('Vehicle type must be car, bike, or truck')
        return v
    
    @field_validator('lat')
    @classmethod
    def validate_latitude(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError('Invalid latitude')
        if v == 0.0:
            raise ValueError('Location not detected')
        return v
    
    @field_validator('lng')
    @classmethod
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

class PaginatedRequests(BaseModel):
    requests: list[RequestWithMechanic]
    total: int
    page: int
    pages: int
    limit: int
