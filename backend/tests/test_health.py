"""
Basic smoke tests: health check and root endpoint.
These verify the app starts and routes are registered correctly.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_root_returns_200(client: AsyncClient):
    r = await client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


async def test_health_returns_healthy(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"
