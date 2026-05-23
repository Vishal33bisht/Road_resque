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


def test_login_uses_short_http_only_cookies_and_returns_mobile_fallback_tokens():
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

    assert "access_token" in body
    assert "refresh_token" in body
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


def test_auth_accepts_bearer_access_token_when_cookies_are_unavailable():
    client = TestClient(app)
    email = f"bearer-user-{uuid4()}@example.com"
    password = "StrongPass1"

    register_response = client.post(
        "/register",
        json={
            "name": "Bearer User",
            "email": email,
            "phone": "+911234567893",
            "password": password,
            "role": "user",
        },
    )
    assert register_response.status_code == 200

    access = register_response.json()["access_token"]
    cookie_free_client = TestClient(app)

    response = cookie_free_client.get("/my-requests", headers={"Authorization": f"Bearer {access}"})

    assert response.status_code == 200


def test_refresh_accepts_body_token_when_cookie_is_unavailable():
    client = TestClient(app)
    email = f"refresh-user-{uuid4()}@example.com"

    register_response = client.post(
        "/register",
        json={
            "name": "Refresh User",
            "email": email,
            "phone": "+911234567894",
            "password": "StrongPass1",
            "role": "user",
        },
    )
    assert register_response.status_code == 200

    refresh = register_response.json()["refresh_token"]
    cookie_free_client = TestClient(app)
    response = cookie_free_client.post("/refresh", json={"refresh_token": refresh})

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["refresh_token"]


def test_registration_can_create_mechanic_account():
    client = TestClient(app)
    email = f"mechanic-signup-{uuid4()}@example.com"

    response = client.post(
        "/register",
        json={
            "name": "Mechanic Signup",
            "email": email,
            "phone": "+911234567891",
            "password": "StrongPass1",
            "role": "mechanic",
        },
    )

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "mechanic"
    assert response.json()["user"]["is_available"] is False


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
