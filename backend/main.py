import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import get_settings
from database import engine
import models
from rate_limit import limiter
from routers import auth, health, mechanic, requests
settings = get_settings()

models.Base.metadata.create_all(bind=engine)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(),
    ],
)

app = FastAPI(title="Roadside Rescue API")

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://road-resque.vercel.app"
)


def parse_cors_origins() -> list[str]:
    origins = settings.cors_origins
    # Ensure production frontend is always included
    if "https://road-resque.vercel.app" not in origins:
        origins.append("https://road-resque.vercel.app")
    return origins


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=(self)")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
        )
        return response


class CsrfHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        unsafe_methods = {"POST", "PUT", "PATCH", "DELETE"}
        exempt_paths = {"/login", "/register", "/refresh", "/logout"}
        if request.method in unsafe_methods and request.url.path not in exempt_paths:
            if request.headers.get("X-Requested-With") != "XMLHttpRequest":
                return JSONResponse({"detail": "CSRF validation failed"}, status_code=403)
        return await call_next(request)


# Register CORS middleware first so it can handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and CSRF middlewares run after CORS
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CsrfHeaderMiddleware)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(health.router, prefix="/api")
app.include_router(requests.router)
app.include_router(mechanic.router)
