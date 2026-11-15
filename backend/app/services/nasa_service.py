import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from enum import StrEnum
from typing import Any

import httpx

NASA_DONKI_API_BASE = "https://ccmc.gsfc.nasa.gov/DONKI-API/get"
CACHE_TTL_SECONDS = 300
REQUEST_TIMEOUT_SECONDS = 10.0
MAX_DATE_RANGE_DAYS = 60

logger = logging.getLogger(__name__)


class EventType(StrEnum):
    FLARE = "FLR"
    SOLAR_PARTICLE = "SEP"
    GEOMAGNETIC_STORM = "GST"
    CME = "CME"


@dataclass(frozen=True)
class SpaceWeatherEvent:
    id: str
    type: EventType
    start_time: str | None
    peak_time: str | None
    end_time: str | None
    classification: str | None
    link: str | None


@dataclass(frozen=True)
class EventBatch:
    events: list[SpaceWeatherEvent]
    retrieved_at: datetime


@dataclass(frozen=True)
class _CacheEntry:
    batch: EventBatch
    expires_at: float


class NASAServiceError(Exception):
    """A safe, user-facing description of an upstream DONKI failure."""


_cache: dict[tuple[EventType, date, date], _CacheEntry] = {}
_cache_lock = asyncio.Lock()


def _read_string(item: dict[str, Any], *names: str) -> str | None:
    for name in names:
        value = item.get(name)
        if isinstance(value, str) and value:
            return value
    return None


def _cme_classification(item: dict[str, Any]) -> str | None:
    analyses = item.get("cmeAnalyses")
    if not isinstance(analyses, list):
        return None

    analysis = next(
        (
            candidate
            for candidate in analyses
            if isinstance(candidate, dict) and candidate.get("isMostAccurate") is True
        ),
        next((candidate for candidate in analyses if isinstance(candidate, dict)), None),
    )
    return _read_string(analysis, "type") if analysis else None


def _normalize_event(
    event_type: EventType, item: dict[str, Any], index: int
) -> SpaceWeatherEvent:
    identifiers = {
        EventType.FLARE: "flrID",
        EventType.SOLAR_PARTICLE: "sepID",
        EventType.GEOMAGNETIC_STORM: "gstID",
        EventType.CME: "activityID",
    }
    start_fields = {
        EventType.FLARE: ("beginTime",),
        EventType.SOLAR_PARTICLE: ("eventTime",),
        EventType.GEOMAGNETIC_STORM: ("startTime",),
        EventType.CME: ("startTime",),
    }
    classification = _read_string(item, "classType", "classification")
    if classification is None and event_type is EventType.CME:
        classification = _cme_classification(item)

    return SpaceWeatherEvent(
        id=_read_string(item, identifiers[event_type]) or f"{event_type.value}-{index + 1}",
        type=event_type,
        start_time=_read_string(item, *start_fields[event_type]),
        peak_time=_read_string(item, "peakTime"),
        end_time=_read_string(item, "endTime"),
        classification=classification,
        link=_read_string(item, "link"),
    )


def _timestamp_sort_key(event: SpaceWeatherEvent) -> datetime:
    if event.start_time is None:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        timestamp = datetime.fromisoformat(event.start_time.replace("Z", "+00:00"))
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    return timestamp.replace(tzinfo=timezone.utc) if timestamp.tzinfo is None else timestamp


async def _fetch_from_nasa(
    event_type: EventType, start_date: date, end_date: date
) -> list[SpaceWeatherEvent]:
    timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS, connect=5.0)
    url = f"{NASA_DONKI_API_BASE}/{event_type.value}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                url,
                params={
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                },
            )
    except httpx.TimeoutException as exc:
        logger.warning("NASA DONKI request timed out for %s", event_type.value)
        raise NASAServiceError("NASA DONKI request timed out.") from exc
    except httpx.RequestError as exc:
        logger.warning("NASA DONKI network request failed for %s", event_type.value)
        raise NASAServiceError("Could not connect to NASA DONKI.") from exc

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code
        logger.warning(
            "NASA DONKI returned HTTP %s for %s", status_code, event_type.value
        )
        if status_code == 429:
            raise NASAServiceError("NASA DONKI rate limit reached.") from exc
        raise NASAServiceError(
            f"NASA DONKI returned HTTP {status_code}."
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        logger.warning("NASA DONKI returned invalid JSON for %s", event_type.value)
        raise NASAServiceError("NASA DONKI returned an invalid response.") from exc

    if not isinstance(payload, list):
        logger.warning("NASA DONKI returned an unexpected payload for %s", event_type.value)
        raise NASAServiceError("NASA DONKI returned an unexpected response.")

    if not all(isinstance(item, dict) for item in payload):
        logger.warning("NASA DONKI returned malformed event data for %s", event_type.value)
        raise NASAServiceError("NASA DONKI returned malformed event data.")

    events = [
        _normalize_event(event_type, item, index)
        for index, item in enumerate(payload)
    ]
    return sorted(events, key=_timestamp_sort_key, reverse=True)


async def fetch_events(
    event_type: EventType, start_date: date, end_date: date
) -> EventBatch:
    key = (event_type, start_date, end_date)
    now = time.monotonic()
    async with _cache_lock:
        cached = _cache.get(key)
        if cached and cached.expires_at > now:
            return cached.batch

    events = await _fetch_from_nasa(event_type, start_date, end_date)
    batch = EventBatch(events=events, retrieved_at=datetime.now(timezone.utc))
    async with _cache_lock:
        _cache[key] = _CacheEntry(
            batch=batch,
            expires_at=time.monotonic() + CACHE_TTL_SECONDS,
        )
    return batch


async def clear_cache() -> None:
    async with _cache_lock:
        _cache.clear()
