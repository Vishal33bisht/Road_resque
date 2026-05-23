from fastapi import Cookie, Depends, HTTPException
import jwt
from sqlalchemy.orm import Session

from database import get_db
import models
from services import auth_service

def get_user_from_token(token: str, db: Session) -> models.User:
    try:
        payload = jwt.decode(
            token,
            auth_service.SECRET_KEY,
            algorithms=[auth_service.ALGORITHM],
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="user not found")
        return user
    except (jwt.PyJWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    token = access_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return get_user_from_token(token, db)
