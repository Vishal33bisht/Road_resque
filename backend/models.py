from sqlalchemy import Column,Integer,String,Boolean,Float,ForeignKey,DateTime
from database import Base
from datetime import datetime
from sqlalchemy.orm import relationship
class User(Base):
    __tablename__="users"
    
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    email=Column(String,unique=True,index=True,nullable=False)
    password_hash=Column(String,nullable=False)
    phone=Column(String,nullable=False)
    role=Column(String,default="user")
    
    is_available=Column(Boolean,default=False)
    latitude=Column(Float,nullable=True)
    longitude=Column(Float,nullable=True)
    
class ServiceRequest(Base):
    __tablename__="service_requests"
    
    id=Column(Integer ,primary_key=True,index=True)
    customer_id=Column(Integer, ForeignKey("users.id"))
    mechanic_id=Column(Integer, ForeignKey("users.id"),nullable=True)
    
    vehicle_type=Column(String,nullable=False)
    problem_desc=Column(String,nullable=False)
    
    lat=Column(Float,nullable=False)
    lng=Column(Float,nullable=False)
    
    status=Column(String,default="Pending")
    created_at=Column(DateTime,default=datetime.utcnow)
    
    