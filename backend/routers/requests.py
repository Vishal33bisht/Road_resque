import math
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from database import SessionLocal, get_db
from dependencies import get_current_user, get_user_from_token
import models
import schemas
from rate_limit import limiter
from services.location import calculate_distance
from services.realtime import request_location_manager

router = APIRouter(tags=["requests"])

VALID_TRANSITIONS = {
    "Pending": ["Accepted", "Cancelled", "Rejected"],
    "Accepted": ["En Route", "Rejected"],
    "En Route": ["Completed"],
    "Completed": [],
    "Cancelled": [],
    "Rejected": [],
}


def validate_status_transition(current_status: str, new_status: str) -> bool:
    return new_status in VALID_TRANSITIONS.get(current_status, [])


def mechanic_payload(mechanic: models.User | None) -> dict | None:
    if not mechanic:
        return None
    return {
        "id": mechanic.id,
        "name": mechanic.name,
        "phone": mechanic.phone,
        "latitude": mechanic.latitude,
        "longitude": mechanic.longitude,
        "is_available": mechanic.is_available,
    }


def mechanic_payload_for_request(req: models.ServiceRequest) -> dict | None:
    payload = mechanic_payload(req.mechanic)
    if not payload:
        return None

    if req.status not in ["Accepted", "En Route"]:
        payload["latitude"] = None
        payload["longitude"] = None
        payload["distance_km"] = None
        return payload

    if req.mechanic.latitude is None or req.mechanic.longitude is None:
        return payload

    payload["distance_km"] = round(
        calculate_distance(req.lat, req.lng, req.mechanic.latitude, req.mechanic.longitude),
        1,
    )
    return payload


async def keep_server_push_socket_alive(websocket: WebSocket) -> None:
    while True:
        try:
            await asyncio.wait_for(websocket.receive_text(), timeout=30)
        except asyncio.TimeoutError:
            await websocket.send_json({"type": "heartbeat"})


@router.post("/requests", response_model=schemas.RequestResponse)
@limiter.limit("10/minute")
def create_request(
    request: Request,
    request_data: schemas.RequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_request = models.ServiceRequest(
        customer_id=current_user.id,
        vehicle_type=request_data.vehicle_type,
        problem_desc=request_data.problem_desc,
        lat=request_data.lat,
        lng=request_data.lng,
        status="Pending",
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("/my-requests", response_model=schemas.PaginatedRequests)
def get_my_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.customer_id == current_user.id
    )
    total = query.count()
    requests = (
        query.options(joinedload(models.ServiceRequest.mechanic))
        .order_by(models.ServiceRequest.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "requests": [
            {
                "id": req.id,
                "customer_id": req.customer_id,
                "mechanic_id": req.mechanic_id,
                "vehicle_type": req.vehicle_type,
                "problem_desc": req.problem_desc,
                "lat": req.lat,
                "lng": req.lng,
                "status": req.status,
                "created_at": req.created_at,
                "mechanic": mechanic_payload_for_request(req),
            }
            for req in requests
        ],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total else 0,
        "limit": limit,
    }


@router.post("/requests/{request_id}/cancel")
def cancel_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@router.post("/requests/{request_id}/reject")
def reject_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="not authorized")

    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status == "Pending" and req.mechanic_id is None:
        return {"status": "ignored"}

    if req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")

    if not validate_status_transition(req.status, "Rejected"):
        raise HTTPException(status_code=400, detail=f"Cannot reject from status '{req.status}'")

    req.status = "Rejected"
    current_user.is_available = True

    db.commit()
    return {"status": "Rejected"}


@router.post("/requests/{request_id}/rate")
def rate_service(
    request_id: int,
    rating: int,
    feedback: str = "",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req or req.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if req.status != "Completed":
        raise HTTPException(status_code=400, detail="Can only rate completed requests")

    req.rating = rating
    req.feedback = feedback
    db.commit()
    return {"message": "Rating submitted successfully"}


@router.post("/requests/{request_id}/accept")
def accept_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    req = (
        db.query(models.ServiceRequest)
        .filter(models.ServiceRequest.id == request_id)
        .with_for_update()
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "Pending":
        raise HTTPException(
            status_code=409,
            detail=f"Request already {req.status.lower()}. Another mechanic may have accepted it.",
        )

    req.status = "Accepted"
    req.mechanic_id = current_user.id
    current_user.is_available = False

    try:
        db.commit()
        return {"status": "assigned", "message": "Job successfully accepted"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept job") from exc


@router.get("/requests/{request_id}", response_model=schemas.RequestWithMechanic)
def get_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.customer_id != current_user.id and req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": req.id,
        "customer_id": req.customer_id,
        "mechanic_id": req.mechanic_id,
        "vehicle_type": req.vehicle_type,
        "problem_desc": req.problem_desc,
        "lat": req.lat,
        "lng": req.lng,
        "status": req.status,
        "created_at": req.created_at,
        "mechanic": mechanic_payload_for_request(req),
    }


@router.websocket("/ws/requests/{request_id}/mechanic-location")
async def mechanic_location_socket(websocket: WebSocket, request_id: int):
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    try:
        current_user = get_user_from_token(token, db)
        req = (
            db.query(models.ServiceRequest)
            .options(joinedload(models.ServiceRequest.mechanic))
            .filter(models.ServiceRequest.id == request_id)
            .first()
        )

        if not req or req.customer_id != current_user.id:
            await websocket.close(code=1008)
            return

        await request_location_manager.connect(request_id, websocket)

        if (
            req.status in ["Accepted", "En Route"]
            and req.mechanic
            and req.mechanic.latitude is not None
            and req.mechanic.longitude is not None
        ):
            await websocket.send_json(
                {
                    "type": "mechanic_location",
                    "request_id": request_id,
                    "mechanic_id": req.mechanic.id,
                    "lat": req.mechanic.latitude,
                    "lng": req.mechanic.longitude,
                    "distance_km": round(
                        calculate_distance(req.lat, req.lng, req.mechanic.latitude, req.mechanic.longitude),
                        1,
                    ),
                    "status": req.status,
                }
            )

        await keep_server_push_socket_alive(websocket)
    except WebSocketDisconnect:
        request_location_manager.disconnect(request_id, websocket)
    except HTTPException:
        await websocket.close(code=1008)
    finally:
        request_location_manager.disconnect(request_id, websocket)
        db.close()


@router.websocket("/ws/mechanic-locations")
async def user_mechanic_locations_socket(websocket: WebSocket):
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    user_id = None
    try:
        current_user = get_user_from_token(token, db)
        user_id = current_user.id
        active_requests = (
            db.query(models.ServiceRequest)
            .options(joinedload(models.ServiceRequest.mechanic))
            .filter(
                models.ServiceRequest.customer_id == current_user.id,
                models.ServiceRequest.status.in_(["Accepted", "En Route"]),
            )
            .all()
        )

        await request_location_manager.connect_user(current_user.id, websocket)

        for req in active_requests:
            if req.mechanic and req.mechanic.latitude is not None and req.mechanic.longitude is not None:
                await websocket.send_json(
                    {
                        "type": "mechanic_location",
                        "request_id": req.id,
                        "mechanic_id": req.mechanic.id,
                        "lat": req.mechanic.latitude,
                        "lng": req.mechanic.longitude,
                        "distance_km": round(
                            calculate_distance(req.lat, req.lng, req.mechanic.latitude, req.mechanic.longitude),
                            1,
                        ),
                        "status": req.status,
                    }
                )

        await keep_server_push_socket_alive(websocket)
    except WebSocketDisconnect:
        if user_id is not None:
            request_location_manager.disconnect_user(user_id, websocket)
    except HTTPException:
        await websocket.close(code=1008)
    finally:
        if user_id is not None:
            request_location_manager.disconnect_user(user_id, websocket)
        db.close()


@router.post("/requests/{request_id}/start")
def start_trip(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.mechanic_id != current_user.id:
        raise HTTPException(status_code=403, detail="This job is not assigned to you")

    if not validate_status_transition(req.status, "En Route"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start trip from status '{req.status}'. Must be 'Accepted'.",
        )

    req.status = "En Route"
    db.commit()
    return {"status": "en_route", "message": "You are now en route to the customer"}


@router.post("/requests/{request_id}/complete")
def complete_job(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "mechanic":
        raise HTTPException(status_code=403, detail="Not authorized")

    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
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
