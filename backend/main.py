from fastapi import FastAPI, Depends, HTTPException, status,Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import jwt
from typing import List
import models, schemas, auth
import math
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Roadside Rescue API")

origins = [
    "http://localhost:5173", 
    "http://192.168.43.59:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: int = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="user not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/")
def read_root():
    return {"message": "Welcome to roadside rescue API"}


@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "Database is connected"}


@app.post("/register", response_model=schemas.UserResponse)
@limiter.limit("5/minute")  # Only 5 registrations per minute per IP
def register(request:Request,user: schemas.UserCreate, db: Session = Depends(get_db)):
    print(f"📨 Received registration data: {user.dict()}")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=user.role,
        is_available=(True if user.role == "mechanic" else False),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "role": user.role, "name": user.name}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@app.post("/requests", response_model=schemas.RequestResponse)
def create_request(request: schemas.RequestCreate,
                   current_user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    
    new_request = models.ServiceRequest(
        customer_id=current_user.id,
        vehicle_type=request.vehicle_type,
        problem_desc=request.problem_desc,
        lat=request.lat,
        lng=request.lng,
        status="Pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@app.get("/my-requests")
def get_my_requests(current_user: models.User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    
    requests = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.customer_id == current_user.id
    ).order_by(models.ServiceRequest.created_at.desc()).all()
    
    result = []
    for req in requests:
        req_data = {
            "id": req.id,
            "customer_id": req.customer_id,
            "mechanic_id": req.mechanic_id,
            "vehicle_type": req.vehicle_type,
            "problem_desc": req.problem_desc,
            "lat": req.lat,
            "lng": req.lng,
            "status": req.status,
            "created_at": req.created_at,
            "mechanic": None
        }
        
        if req.mechanic_id:
            mechanic = db.query(models.User).filter(models.User.id == req.mechanic_id).first()
            if mechanic:
                req_data["mechanic"] = {
                    "id": mechanic.id,
                    "name": mechanic.name,
                    "phone": mechanic.phone
                }
        
        result.append(req_data)
    
    return result


@app.post("/requests/{request_id}/cancel")
def cancel_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this request")
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Cannot cancel a request that is already processed")
    req.status = "Cancelled"
    db.commit()
    return {"status": "Cancelled"}


@app.post("/requests/{request_id}/reject")
def reject_request(request_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="not authorized")
    
    # FIXED: Changed request.id to request_id
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "Rejected"
    current_user.is_available = True
    
    db.commit()
    return {"status": "Rejected"}


@app.post("/mechanic/availability")
def toggle_availability(lat: float, lng: float,
                        current_user: models.User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    current_user.is_available = not current_user.is_available
    current_user.latitude = lat
    current_user.longitude = lng
    db.commit()
    return {"is_available": current_user.is_available}


@app.get("/mechanic/requests", response_model=List[schemas.RequestResponse])
def get_nearby_requests(current_user: models.User = Depends(get_current_user), 
                        db: Session = Depends(get_db)):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logger.info(f"Mechanic {current_user.name} requesting nearby jobs")
    logger.debug(f"Mechanic Location: {current_user.latitude}, {current_user.longitude}")
    
    pending_requests = db.query(models.ServiceRequest).filter(models.ServiceRequest.status == "Pending").all()
    print(f"Total Pending Requests in DB: {len(pending_requests)}")
    
    nearby = []
    for req in pending_requests:
        if current_user.latitude is not None and current_user.longitude is not None:
            dist = calculate_distance(current_user.latitude, current_user.longitude, req.lat, req.lng)
            print(f" -> Request {req.id} Distance: {dist:.2f} km")
            
            if dist < 20000:
                nearby.append(req)
        else:
            print(" -> Skipping request: Mechanic has no location set.")

    print(f"Returning {len(nearby)} requests")
    print("-----------------------------------")
    
    return nearby


@app.post("/requests/{request_id}/accept")
def accept_request(request_id: int, 
                   current_user: models.User = Depends(get_current_user), 
                   db: Session = Depends(get_db)):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request already taken")
    req.status = "Accepted"
    req.mechanic_id = current_user.id
    current_user.is_available = False
    
    db.commit()
    return {"status": "assigned"}


@app.get("/requests/{request_id}", response_model=schemas.RequestWithMechanic)
def get_request(request_id: int,
                current_user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    
    req = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.customer_id != current_user.id and req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    response = {
        "id": req.id,
        "customer_id": req.customer_id,
        "mechanic_id": req.mechanic_id,
        "vehicle_type": req.vehicle_type,
        "problem_desc": req.problem_desc,
        "lat": req.lat,
        "lng": req.lng,
        "status": req.status,
        "created_at": req.created_at,
        "mechanic": None
    }
    if req.mechanic_id:
        mechanic = db.query(models.User).filter(models.User.id == req.mechanic_id).first()
        if mechanic:
            response["mechanic"] = {
                "id": mechanic.id,
                "name": mechanic.name,
                "phone": mechanic.phone
            }
    
    return response


@app.post("/requests/{request_id}/start")
def start_trip(request_id: int,
               current_user: models.User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    req = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.id == request_id
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")
    
    if req.status != "Accepted":
        raise HTTPException(status_code=400, detail=f"Cannot start trip. Current status: {req.status}")
    
    req.status = "En Route"
    db.commit()
    
    return {"status": "en_route", "message": "You are now en route to the customer"}


@app.post("/requests/{request_id}/complete")
def complete_job(request_id: int,
                 current_user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    req = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.id == request_id
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")
    
    if req.status not in ["Accepted", "En Route"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete. Current status: {req.status}")
    
    req.status = "Completed"
    current_user.is_available = True
    db.commit()
    
    return {"status": "completed", "message": "Job completed successfully!"}


@app.get("/mechanic/active-job")
def get_active_job(current_user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    active_job = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.mechanic_id == current_user.id,
        models.ServiceRequest.status.in_(["Accepted", "En Route"])
    ).first()
    
    if not active_job:
        return None
    
    customer = db.query(models.User).filter(models.User.id == active_job.customer_id).first()
    
    return {
        "id": active_job.id,
        "vehicle_type": active_job.vehicle_type,
        "problem_desc": active_job.problem_desc,
        "lat": active_job.lat,
        "lng": active_job.lng,
        "status": active_job.status,
        "created_at": active_job.created_at,
        "customer": {
            "name": customer.name,
            "phone": customer.phone
        } if customer else None
    }