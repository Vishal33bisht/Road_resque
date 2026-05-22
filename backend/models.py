from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
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

    customer_requests = relationship(
        "ServiceRequest",
        foreign_keys="ServiceRequest.customer_id",
        back_populates="customer",
    )
    mechanic_requests = relationship(
        "ServiceRequest",
        foreign_keys="ServiceRequest.mechanic_id",
        back_populates="mechanic",
    )
    
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
    
    rating = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)
    
    estimated_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)

    customer = relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="customer_requests",
    )
    mechanic = relationship(
        "User",
        foreign_keys=[mechanic_id],
        back_populates="mechanic_requests",
    )


Index("idx_service_requests_status_created", ServiceRequest.status, ServiceRequest.created_at.desc())
Index("idx_service_requests_customer_created", ServiceRequest.customer_id, ServiceRequest.created_at.desc())
Index("idx_service_requests_mechanic_status", ServiceRequest.mechanic_id, ServiceRequest.status)
Index("idx_users_mechanic_available", User.role, User.is_available)
