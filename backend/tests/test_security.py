import os
from http.cookies import SimpleCookie
from datetime import datetime, timezone
from uuid import uuid4

os.environ.setdefault("TESTING", "true")
os.environ.setdefault("SECRET_KEY", "test-secret-key-with-enough-entropy")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_roadside_rescue.db")

import jwt
from fastapi.testclient import TestClient

import models
from main import app
from routers.requests import mechanic_payload_for_request
from services import auth_service


def test_security_headers_are_present():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "default-src 'self'" in response.headers["content-security-policy"]


def test_login_uses_short_http_only_access_and_refresh_cookies():
    client = TestClient(app)
    email = f"user-{uuid4()}@example.com"
    password = "StrongPass1"

    register_response = client.post(
        "/register",
        json={
            "name": "Test User",
            "email": email,
            "phone": "+911234567890",
            "password": password,
            "role": "user",
        },
    )
    assert register_response.status_code == 200

    login_response = client.post("/login", data={"username": email, "password": password})
    assert login_response.status_code == 200

    body = login_response.json()
    cookies = SimpleCookie()
    cookies.load(login_response.headers["set-cookie"])

    assert "access_token" not in body
    assert "refresh_token" not in body
    assert "access_token" in cookies
    assert "refresh_token" in cookies
    assert cookies["access_token"]["httponly"]
    assert cookies["refresh_token"]["httponly"]

    payload = jwt.decode(cookies["access_token"].value, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    ttl_seconds = (expires_at - datetime.now(timezone.utc)).total_seconds()

    assert payload["type"] == "access"
    assert ttl_seconds <= 30 * 60
    assert body["expires_in"] == 30 * 60
    assert body["user"]["email"] == email


def test_auth_requires_http_only_access_cookie():
    client = TestClient(app)
    access = auth_service.create_access_token({"sub": "1", "role": "user", "name": "Test User"})

    response = client.get("/my-requests", headers={"Authorization": f"Bearer {access}"})

    assert response.status_code == 401


def test_registration_cannot_self_assign_mechanic_role():
    client = TestClient(app)
    email = f"mechanic-escalation-{uuid4()}@example.com"

    response = client.post(
        "/register",
        json={
            "name": "Privilege Tester",
            "email": email,
            "phone": "+911234567891",
            "password": "StrongPass1",
            "role": "mechanic",
        },
    )

    assert response.status_code == 200
    assert response.json()["role"] == "user"
    assert response.json()["is_available"] is False


def test_completed_request_does_not_expose_mechanic_live_coordinates():
    mechanic = models.User(
        id=2,
        name="Mechanic",
        email="mechanic@example.com",
        phone="+911234567892",
        password_hash="hash",
        role="mechanic",
        latitude=28.6139,
        longitude=77.2090,
        is_available=True,
    )
    request = models.ServiceRequest(
        id=10,
        customer_id=1,
        mechanic_id=2,
        vehicle_type="car",
        problem_desc="Battery issue after trip",
        lat=28.5,
        lng=77.1,
        status="Completed",
    )
    request.mechanic = mechanic

    payload = mechanic_payload_for_request(request)

    assert payload["latitude"] is None
    assert payload["longitude"] is None
    assert payload["distance_km"] is None
