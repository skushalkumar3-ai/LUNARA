import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes.space_weather import router as space_weather_router

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LUNARA Mission Trainer API",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Accept"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "lunara-api"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "lunara-api"}


app.include_router(space_weather_router)
logger.info("LUNARA FastAPI routes: %s", sorted(app.openapi()["paths"]))
