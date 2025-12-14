from fastapi import FastAPI,Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine,get_db
import jwt
from typing import List
import models,schemas,auth
import math

#models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

app=FastAPI(title="Roadside resque API")

origins = [
    "http://localhost:5173", # React Frontend
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def calculate_distance(lat1,lon1,lat2,lon2):
    R=6371
    dLat=math.radians(lat2-lat1)
    dLon=math.radians(lon2-lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat1)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
  
def get_current_user(token: str=Depends(oauth2_scheme),db: Session=Depends(get_db)):
    try:
        payload=jwt.decode(token,auth.SECRET_KEY,algorithms=[auth.ALGORITHM])
        user_id: int= int(payload.get("sub"))
        user=db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401,detail="user not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401,detail="Invalid token")

@app.post("/requests" ,response_model=schemas.RequestResponse)
def create_request(request: schemas.RequestCreate,
                   current_user: models.User = Depends(get_current_user),
                   db: Session =Depends(get_db)):
    
    new_request=models.ServiceRequest(
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

@app.get("/my-requests",response_model=List[schemas.RequestResponse])
def get_my_requests(current_user: models.User=Depends(get_current_user),db:Session=Depends(get_db)):
    return db.query(models.ServiceRequest).filter(models.ServiceRequest.customer_id == current_user.id).all()
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session=Depends(get_db)):
    db_user=db.query(models.User).filter(models.User.email==user.email).first()
    if db_user:
        raise HTTPException(status_code=400,detail="Email already registered")
    
    hashed_password=auth.get_password_hash(user.password)
    
    new_user=models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=user.role,
        is_available=(True if user.role=="mechanic" else False),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(form_data : OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
    user=db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password,user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
            )
    access_token=auth.create_access_token(
        data={"sub": str(user.id), "role":user.role}
    )
    
    return {"access_token": access_token ,"token_type":"bearer", "role":user.role}


@app.post("/mechanic/availability")
def toogle_availability(lat:float,lng:float,
        current_user:models.User=Depends(get_current_user),
        db:Session=Depends(get_db)):
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
    
    # DEBUG: Print Mechanic's Info
    print(f"--- DEBUG: Mechanic {current_user.name} ---")
    print(f"Mechanic Location: {current_user.latitude}, {current_user.longitude}")

    # Get all pending requests
    pending_requests = db.query(models.ServiceRequest).filter(models.ServiceRequest.status == "Pending").all()
    print(f"Total Pending Requests in DB: {len(pending_requests)}")
    
    nearby = []
    for req in pending_requests:
        # Check if mechanic has location
        if current_user.latitude is not None and current_user.longitude is not None:
            dist = calculate_distance(current_user.latitude, current_user.longitude, req.lat, req.lng)
            print(f" -> Request {req.id} Distance: {dist:.2f} km")
            
            if dist < 20000: # Temporary: Increased range to 1000km just to test!
                nearby.append(req)
        else:
            print(" -> Skipping request: Mechanic has no location set.")

    print(f"Returning {len(nearby)} requests")
    print("-----------------------------------")
    
    return nearby
    
@app.get("/")
def read_root():
    return {"message": "Welcome to roadside rescue API"} 

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "Database is connected"}  

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
     return {"status":"assigned"}