import logging

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
import models
import schemas
from rate_limit import limiter
from services import auth_service

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)
settings = get_settings()


def user_payload(user: models.User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_available": user.is_available,
    }


def set_token_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        httponly=True,
        secure=settings.secure_cookies,
        samesite=settings.cookie_samesite,
        path="/",
    )


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    set_token_cookie(
        response,
        "access_token",
        access_token,
        settings.access_token_expire_minutes * 60,
    )
    set_token_cookie(
        response,
        "refresh_token",
        refresh_token,
        settings.refresh_token_expire_days * 24 * 60 * 60,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.secure_cookies,
        samesite=settings.cookie_samesite,
        path="/",
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.secure_cookies,
        samesite=settings.cookie_samesite,
        path="/",
    )


@router.post("/register")
def register(user: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    logger.info("New registration attempt: %s", user.email)
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth_service.get_password_hash(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role="user",
        is_available=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login after registration by setting auth cookies
    access_token = auth_service.create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role, "name": new_user.name}
    )
    refresh_token = auth_service.create_refresh_token(data={"sub": str(new_user.id)})
    set_auth_cookies(response, access_token, refresh_token)
    
    return {
        "expires_in": settings.access_token_expire_minutes * 60,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_payload(new_user),
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_service.verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role, "name": user.name}
    )
    refresh_token = auth_service.create_refresh_token(data={"sub": str(user.id)})
    set_auth_cookies(response, access_token, refresh_token)
    return {
        "expires_in": settings.access_token_expire_minutes * 60,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_payload(user),
    }


@router.post("/refresh")
def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        payload = jwt.decode(
            refresh_token,
            auth_service.SECRET_KEY,
            algorithms=[auth_service.ALGORITHM],
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role, "name": user.name}
    )
    rotated_refresh_token = auth_service.create_refresh_token(data={"sub": str(user.id)})
    set_auth_cookies(response, access_token, rotated_refresh_token)
    return {
        "expires_in": settings.access_token_expire_minutes * 60,
        "access_token": access_token,
        "refresh_token": rotated_refresh_token,
        "user": user_payload(user),
    }


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.get("/me")
def me(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(
            access_token,
            auth_service.SECRET_KEY,
            algorithms=[auth_service.ALGORITHM],
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user_payload(user)
