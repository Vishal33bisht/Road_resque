import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import engine
import models
from rate_limit import limiter
from routers import auth, health, mechanic, requests

load_dotenv()

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
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "https://road-resque.vercel.app"
)


def parse_cors_origins() -> list[str]:
    origins = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    return [origin.strip().rstrip("/") for origin in origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(requests.router)
app.include_router(mechanic.router)
