import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas
from rate_limit import limiter
from services.location import calculate_distance

router = APIRouter(tags=["mechanic"])
logger = logging.getLogger(__name__)


@router.post("/mechanic/availability")
def toggle_availability(
    lat: float,
    lng: float,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    current_user.is_available = not current_user.is_available
    current_user.latitude = lat
    current_user.longitude = lng
    db.commit()
    return {"is_available": current_user.is_available}


@router.get("/mechanic/requests", response_model=List[schemas.RequestResponse])
@limiter.limit("60/minute")
def get_nearby_requests(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.latitude is None or current_user.longitude is None:
        return []

    logger.info("Mechanic %s requesting nearby jobs", current_user.name)

    pending_requests = (
        db.query(models.ServiceRequest)
        .filter(models.ServiceRequest.status == "Pending")
        .limit(50)
        .all()
    )
    logger.info("Total Pending Requests in DB: %s", len(pending_requests))

    nearby = []
    for req in pending_requests:
        dist = calculate_distance(current_user.latitude, current_user.longitude, req.lat, req.lng)
        logger.debug("Request %s Distance: %.2f km", req.id, dist)

        if dist < 50:
            nearby.append(req)

    logger.info("Returning %s requests", len(nearby))
    return nearby


@router.post("/mechanic/update-location")
def update_mechanic_location(
    lat: float,
    lng: float,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    current_user.latitude = lat
    current_user.longitude = lng
    db.commit()

    return {"message": "Location updated", "lat": lat, "lng": lng}


@router.get("/mechanic/active-job")
def get_active_job(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    active_job = (
        db.query(models.ServiceRequest)
        .filter(
            models.ServiceRequest.mechanic_id == current_user.id,
            models.ServiceRequest.status.in_(["Accepted", "En Route"]),
        )
        .first()
    )

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
            "phone": customer.phone,
        }
        if customer
        else None,
    }
