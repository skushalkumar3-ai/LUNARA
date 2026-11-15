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


def _registered_route_details() -> list[str]:
    details: list[str] = []

    def collect(routes) -> None:
        for route in routes:
            path = getattr(route, "path", None)
            methods = getattr(route, "methods", None)
            if path is not None and methods:
                for method in sorted(methods):
                    details.append(f"{method} {path}")

            included_router = getattr(route, "original_router", None)
            if included_router is not None:
                collect(included_router.routes)

    collect(app.routes)
    return sorted(set(details))


logger.info("LUNARA registered routes:\n%s", "\n".join(_registered_route_details()))
