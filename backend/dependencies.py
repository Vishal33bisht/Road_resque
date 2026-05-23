from fastapi import Cookie, Depends, HTTPException, Request
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
    request: Request,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    tokens: list[str] = []
    if access_token:
        tokens.append(access_token)

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        bearer_token = auth_header[7:].strip()
        if bearer_token and bearer_token not in tokens:
            tokens.append(bearer_token)

    if not tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")

    last_error: HTTPException | None = None
    for token in tokens:
        try:
            return get_user_from_token(token, db)
        except HTTPException as exc:
            last_error = exc

    raise last_error or HTTPException(status_code=401, detail="Invalid token")
