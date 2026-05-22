import logging
import math

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from database import get_db
from dependencies import get_current_user
import models
import schemas
from rate_limit import limiter
from services.location import calculate_distance
from services.realtime import request_location_manager

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

    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    current_user.is_available = not current_user.is_available
    current_user.latitude = lat
    current_user.longitude = lng
    db.commit()
    return {"is_available": current_user.is_available}


@router.get("/mechanic/requests", response_model=schemas.PaginatedRequests)
@limiter.limit("60/minute")
def get_nearby_requests(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.latitude is None or current_user.longitude is None:
        return {"requests": [], "total": 0, "page": page, "pages": 0, "limit": limit}

    logger.info("Mechanic %s requesting nearby jobs", current_user.name)

    pending_requests = (
        db.query(models.ServiceRequest)
        .filter(models.ServiceRequest.status == "Pending")
        .order_by(models.ServiceRequest.created_at.desc())
        .limit(500)
        .all()
    )
    logger.info("Total Pending Requests in DB: %s", len(pending_requests))

    nearby = []
    for req in pending_requests:
        dist = calculate_distance(current_user.latitude, current_user.longitude, req.lat, req.lng)
        logger.debug("Request %s Distance: %.2f km", req.id, dist)
        req.distance_km = round(dist, 1)
        nearby.append(req)

    nearby.sort(key=lambda req: req.distance_km)

    total = len(nearby)
    offset = (page - 1) * limit
    paginated = nearby[offset:offset + limit]

    logger.info("Returning %s requests", len(paginated))
    return {
        "requests": paginated,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total else 0,
        "limit": limit,
    }


@router.post("/mechanic/update-location")
async def update_mechanic_location(
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

    active_jobs = (
        db.query(models.ServiceRequest)
        .filter(
            models.ServiceRequest.mechanic_id == current_user.id,
            models.ServiceRequest.status.in_(["Accepted", "En Route"]),
        )
        .all()
    )

    for job in active_jobs:
        payload = {
            "type": "mechanic_location",
            "request_id": job.id,
            "mechanic_id": current_user.id,
            "lat": lat,
            "lng": lng,
            "distance_km": round(calculate_distance(job.lat, job.lng, lat, lng), 1),
            "status": job.status,
        }
        await request_location_manager.broadcast(job.id, payload)
        await request_location_manager.broadcast_to_user(job.customer_id, payload)

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
        .options(joinedload(models.ServiceRequest.customer))
        .filter(
            models.ServiceRequest.mechanic_id == current_user.id,
            models.ServiceRequest.status.in_(["Accepted", "En Route"]),
        )
        .first()
    )

    if not active_job:
        return None

    return {
        "id": active_job.id,
        "vehicle_type": active_job.vehicle_type,
        "problem_desc": active_job.problem_desc,
        "lat": active_job.lat,
        "lng": active_job.lng,
        "status": active_job.status,
        "created_at": active_job.created_at,
        "customer": {
            "name": active_job.customer.name,
            "phone": active_job.customer.phone,
        }
        if active_job.customer
        else None,
    }
