import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..services.nasa_service import (
    MAX_DATE_RANGE_DAYS,
    EventBatch,
    EventType,
    NASAServiceError,
    SpaceWeatherEvent,
    fetch_events,
)

router = APIRouter(prefix="/api/space-weather", tags=["space-weather"])

ApiStatus = Literal["live", "partial", "unavailable"]


class SpaceWeatherResponse(BaseModel):
    data_source: str = "NASA CCMC DONKI API"
    retrieved_at: datetime
    last_successful_retrieval: datetime | None
    api_status: ApiStatus
    events: dict[str, list[SpaceWeatherEvent]]
    errors: dict[str, str]


def _date_range(
    start_date: date | None, end_date: date | None
) -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    end = end_date or today
    start = start_date or end - timedelta(days=30)

    if start > end:
        raise HTTPException(
            status_code=422, detail="startDate must be on or before endDate."
        )
    if end > today:
        raise HTTPException(status_code=422, detail="endDate cannot be in the future.")
    if (end - start).days > MAX_DATE_RANGE_DAYS:
        raise HTTPException(
            status_code=422,
            detail=f"The requested date range cannot exceed {MAX_DATE_RANGE_DAYS} days.",
        )
    return start, end


async def _fetch_category(
    event_type: EventType, start_date: date, end_date: date
) -> EventBatch:
    return await fetch_events(event_type, start_date, end_date)


async def _category_response(
    event_type: EventType, start_date: date, end_date: date
) -> SpaceWeatherResponse:
    retrieved_at = datetime.now(timezone.utc)
    events = {kind.value: [] for kind in EventType}
    try:
        batch = await _fetch_category(event_type, start_date, end_date)
    except NASAServiceError as exc:
        errors = {event_type.value: str(exc)}
        return SpaceWeatherResponse(
            retrieved_at=retrieved_at,
            last_successful_retrieval=None,
            api_status="unavailable",
            events=events,
            errors=errors,
        )

    events[event_type.value] = batch.events
    return SpaceWeatherResponse(
        retrieved_at=retrieved_at,
        last_successful_retrieval=batch.retrieved_at,
        api_status="live",
        events=events,
        errors={},
    )


async def _capture_category(
    event_type: EventType, start_date: date, end_date: date
) -> tuple[EventBatch | None, str | None]:
    try:
        return await _fetch_category(event_type, start_date, end_date), None
    except NASAServiceError as exc:
        return None, str(exc)


async def _combined_response(
    start_date: date, end_date: date
) -> SpaceWeatherResponse:
    event_types = list(EventType)
    results = await asyncio.gather(
        *(
            _capture_category(event_type, start_date, end_date)
            for event_type in event_types
        )
    )
    events: dict[str, list[SpaceWeatherEvent]] = {}
    errors: dict[str, str] = {}
    successful_batches: list[EventBatch] = []

    for event_type, (batch, error) in zip(event_types, results):
        if error is not None:
            events[event_type.value] = []
            errors[event_type.value] = error
        else:
            assert batch is not None
            events[event_type.value] = batch.events
            successful_batches.append(batch)

    if errors and not successful_batches:
        api_status: ApiStatus = "unavailable"
    elif errors:
        api_status = "partial"
    else:
        api_status = "live"

    return SpaceWeatherResponse(
        retrieved_at=datetime.now(timezone.utc),
        last_successful_retrieval=max(
            (batch.retrieved_at for batch in successful_batches), default=None
        ),
        api_status=api_status,
        events=events,
        errors=errors,
    )


def _response_for_status(response: SpaceWeatherResponse) -> JSONResponse:
    status_code = 503 if response.api_status == "unavailable" else 200
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(mode="json"),
    )


@router.get("", response_model=SpaceWeatherResponse)
async def get_space_weather(
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
) -> JSONResponse:
    start, end = _date_range(start_date, end_date)
    return _response_for_status(await _combined_response(start, end))


@router.get("/flares", response_model=SpaceWeatherResponse)
async def get_flares(
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
) -> JSONResponse:
    start, end = _date_range(start_date, end_date)
    return _response_for_status(
        await _category_response(EventType.FLARE, start, end)
    )


@router.get("/solar-particles", response_model=SpaceWeatherResponse)
async def get_solar_particles(
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
) -> JSONResponse:
    start, end = _date_range(start_date, end_date)
    return _response_for_status(
        await _category_response(EventType.SOLAR_PARTICLE, start, end)
    )


@router.get("/geomagnetic-storms", response_model=SpaceWeatherResponse)
async def get_geomagnetic_storms(
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
) -> JSONResponse:
    start, end = _date_range(start_date, end_date)
    return _response_for_status(
        await _category_response(EventType.GEOMAGNETIC_STORM, start, end)
    )


@router.get("/cme", response_model=SpaceWeatherResponse)
async def get_cme(
    start_date: date | None = Query(default=None, alias="startDate"),
    end_date: date | None = Query(default=None, alias="endDate"),
) -> JSONResponse:
    start, end = _date_range(start_date, end_date)
    return _response_for_status(
        await _category_response(EventType.CME, start, end)
    )
