import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import main
from app.services import nasa_service
from app.services.nasa_service import EventType


class SpaceWeatherRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        nasa_service._cache.clear()
        self.client = TestClient(main.app)
        today = datetime.now(timezone.utc).date()
        self.start_date = (today - timedelta(days=1)).isoformat()
        self.end_date = today.isoformat()

    def test_health_and_each_space_weather_endpoint(self) -> None:
        records = {
            EventType.FLARE: {
                "flrID": "flare-1",
                "beginTime": "2026-11-14T21:16Z",
                "peakTime": "2026-11-14T21:27Z",
                "classType": "C2.8",
                "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/1/-1",
            },
            EventType.SOLAR_PARTICLE: {
                "sepID": "sep-1",
                "eventTime": "2026-11-14T22:00Z",
            },
            EventType.GEOMAGNETIC_STORM: {
                "gstID": "gst-1",
                "startTime": "2026-11-14T23:00Z",
            },
            EventType.CME: {
                "activityID": "cme-1",
                "startTime": "2026-11-14T20:00Z",
                "cmeAnalyses": [{"type": "C", "isMostAccurate": True}],
            },
        }

        async def fake_fetch(event_type, _start_date, _end_date):
            return [
                nasa_service._normalize_event(
                    event_type, records[event_type], index=0
                )
            ]

        with patch.object(
            nasa_service, "_fetch_from_nasa", new=AsyncMock(side_effect=fake_fetch)
        ):
            health = self.client.get("/api/health")
            self.assertEqual(health.status_code, 200)
            self.assertEqual(health.json()["status"], "ok")

            combined = self.client.get(
                "/api/space-weather",
                params={"startDate": self.start_date, "endDate": self.end_date},
            )
            self.assertEqual(combined.status_code, 200)
            payload = combined.json()
            self.assertEqual(payload["api_status"], "live")
            self.assertEqual(payload["data_source"], "NASA CCMC DONKI API")
            self.assertIsNotNone(payload["last_successful_retrieval"])
            self.assertEqual(payload["events"]["FLR"][0]["classification"], "C2.8")
            self.assertEqual(payload["events"]["CME"][0]["classification"], "C")

            for path in (
                "/api/space-weather/flares",
                "/api/space-weather/solar-particles",
                "/api/space-weather/geomagnetic-storms",
                "/api/space-weather/cme",
            ):
                response = self.client.get(
                    path,
                    params={"startDate": self.start_date, "endDate": self.end_date},
                )
                self.assertEqual(response.status_code, 200, path)
                self.assertEqual(response.json()["api_status"], "live", path)

    def test_date_range_validation(self) -> None:
        reversed_range = self.client.get(
            "/api/space-weather",
            params={"startDate": self.end_date, "endDate": self.start_date},
        )
        self.assertEqual(reversed_range.status_code, 422)

        oversized_range = self.client.get(
            "/api/space-weather",
            params={
                "startDate": (datetime.now(timezone.utc).date() - timedelta(days=61)).isoformat(),
                "endDate": self.end_date,
            },
        )
        self.assertEqual(oversized_range.status_code, 422)

    def test_upstream_failure_is_reported(self) -> None:
        with patch.object(
            nasa_service,
            "_fetch_from_nasa",
            new=AsyncMock(side_effect=nasa_service.NASAServiceError("NASA DONKI rate limit reached.")),
        ):
            response = self.client.get(
                "/api/space-weather",
                params={"startDate": self.start_date, "endDate": self.end_date},
            )

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertEqual(payload["api_status"], "unavailable")
        self.assertEqual(payload["errors"]["FLR"], "NASA DONKI rate limit reached.")
        self.assertIsNone(payload["last_successful_retrieval"])


class NASAServiceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        await nasa_service.clear_cache()

    async def asyncTearDown(self) -> None:
        await nasa_service.clear_cache()

    async def test_successful_empty_response_is_cached(self) -> None:
        today = datetime.now(timezone.utc).date()
        with patch.object(
            nasa_service, "_fetch_from_nasa", new=AsyncMock(return_value=[])
        ) as fetch:
            first = await nasa_service.fetch_events(
                EventType.FLARE, today, today
            )
            second = await nasa_service.fetch_events(
                EventType.FLARE, today, today
            )

        self.assertEqual(first.events, [])
        self.assertEqual(second.retrieved_at, first.retrieved_at)
        fetch.assert_awaited_once()

    async def test_network_failure_is_reported_without_api_key(self) -> None:
        class OfflineClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return None

            async def get(self, url, **_kwargs):
                request = httpx.Request("GET", url)
                raise httpx.ConnectError("connection refused", request=request)

        today = datetime.now(timezone.utc).date()
        with patch.object(
            nasa_service.httpx, "AsyncClient", return_value=OfflineClient()
        ):
            with self.assertRaisesRegex(
                nasa_service.NASAServiceError, "Could not connect to NASA DONKI"
            ):
                await nasa_service._fetch_from_nasa(EventType.FLARE, today, today)

    async def test_nasa_rate_limit_is_reported(self) -> None:
        class RateLimitedClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return None

            async def get(self, url, **_kwargs):
                request = httpx.Request("GET", url)
                return httpx.Response(429, request=request)

        today = datetime.now(timezone.utc).date()
        with patch.object(
            nasa_service.httpx, "AsyncClient", return_value=RateLimitedClient()
        ):
            with self.assertRaisesRegex(
                nasa_service.NASAServiceError, "NASA DONKI rate limit reached"
            ):
                await nasa_service._fetch_from_nasa(EventType.FLARE, today, today)


if __name__ == "__main__":
    unittest.main()
