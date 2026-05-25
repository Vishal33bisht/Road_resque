from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/api",tags=["health"])


@router.get("/")
def read_root():
    return {"message": "Welcome to roadside rescue API"}

@router.get("/health")
def health_check():
    return {"status":"ok"}

@router.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "Database is connected"}
