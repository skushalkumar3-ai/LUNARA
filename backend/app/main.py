from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes.space_weather import router as space_weather_router

settings = get_settings()

app = FastAPI(title="LUNARA Mission Trainer API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Accept"],
)
app.include_router(space_weather_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "lunara-api"}
