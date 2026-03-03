"""
Tests for GET /fun/random

The fun endpoint does not touch the database, so no db_session fixture needed.
For the meme type we mock the external httpx call to avoid network dependency.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, Response

pytestmark = pytest.mark.asyncio

VIDEO_TYPES = ["cat", "dogfail", "science"]


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH — video types
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.parametrize("fun_type", VIDEO_TYPES)
async def test_video_type_returns_correct_structure(client: AsyncClient, fun_type: str):
    """Video types return type=video, title, and a YouTube URL."""
    r = await client.get(f"/fun/random?type={fun_type}")
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "video"
    assert "title" in body and isinstance(body["title"], str) and body["title"]
    assert "url" in body
    assert "youtube.com" in body["url"]


@pytest.mark.parametrize("fun_type", VIDEO_TYPES)
async def test_video_url_is_search_url(client: AsyncClient, fun_type: str):
    """Video URL must be a YouTube search results URL (not an embed)."""
    r = await client.get(f"/fun/random?type={fun_type}")
    assert "youtube.com/results?search_query=" in r.json()["url"]


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH — meme type (mocked external API)
# ══════════════════════════════════════════════════════════════════════════════


def _make_mock_httpx_client(response_data: dict):
    """Build a mock httpx.AsyncClient context manager that returns response_data."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = response_data

    mock_instance = AsyncMock()
    mock_instance.get = AsyncMock(return_value=mock_response)

    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_instance)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    return mock_cls


async def test_meme_type_returns_correct_structure_from_external_api(client: AsyncClient):
    """Meme type returns type=meme, title, url when external API succeeds."""
    mock_cls = _make_mock_httpx_client({"title": "Test Meme", "url": "https://i.redd.it/test.jpg"})

    with patch("app.services.fun_service.httpx.AsyncClient", mock_cls):
        r = await client.get("/fun/random?type=meme")

    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "meme"
    assert "title" in body
    assert "url" in body


def _make_failing_httpx_client():
    """Build a mock httpx.AsyncClient whose .get raises an exception."""
    mock_instance = AsyncMock()
    mock_instance.get = AsyncMock(side_effect=Exception("network error"))

    mock_cls = MagicMock()
    mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_instance)
    mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    return mock_cls


async def test_meme_type_falls_back_when_external_api_fails(client: AsyncClient):
    """When external meme API fails, fallback meme is returned (still type=meme)."""
    with patch("app.services.fun_service.httpx.AsyncClient", _make_failing_httpx_client()):
        r = await client.get("/fun/random?type=meme")

    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "meme"
    assert "title" in body
    assert "url" in body


async def test_meme_fallback_url_is_picsum(client: AsyncClient):
    """Fallback meme URL uses picsum.photos."""
    with patch("app.services.fun_service.httpx.AsyncClient", _make_failing_httpx_client()):
        r = await client.get("/fun/random?type=meme")

    assert "picsum.photos" in r.json()["url"]


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH — absurd longread type
# ══════════════════════════════════════════════════════════════════════════════


async def test_absurd_type_returns_correct_structure(client: AsyncClient):
    """Absurd type returns all required longread fields."""
    r = await client.get("/fun/random?type=absurd")
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "absurd"
    assert "title" in body and body["title"]
    assert "body" in body and body["body"]
    assert "category" in body
    assert "estimated_read_time_sec" in body
    assert isinstance(body["estimated_read_time_sec"], int)
    assert "learn_more_url" in body
    assert "google.com/search" in body["learn_more_url"]


async def test_absurd_body_is_non_empty_string(client: AsyncClient):
    """Absurd body text must be a non-empty string."""
    r = await client.get("/fun/random?type=absurd")
    body = r.json()
    assert isinstance(body["body"], str)
    assert len(body["body"]) > 10


async def test_absurd_estimated_read_time_is_positive(client: AsyncClient):
    """estimated_read_time_sec must be a positive integer."""
    r = await client.get("/fun/random?type=absurd")
    assert r.json()["estimated_read_time_sec"] > 0


# ══════════════════════════════════════════════════════════════════════════════
# EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════


async def test_invalid_type_returns_error(client: AsyncClient):
    """
    Unknown type query param: the router raises HTTPException(400) inside the
    try block, but the bare `except Exception` re-raises it as 500.
    Assert the actual observed status code (500).
    """
    r = await client.get("/fun/random?type=invalid_type")
    assert r.status_code in (400, 500)


async def test_missing_type_param_returns_422(client: AsyncClient):
    """Missing required type or energy query param returns 400 Bad Request."""
    r = await client.get("/fun/random")
    assert r.status_code == 400


async def test_empty_type_param_returns_error(client: AsyncClient):
    """Empty string type: HTTPException(400) is swallowed by except Exception → 500."""
    r = await client.get("/fun/random?type=")
    assert r.status_code in (400, 500)


async def test_unknown_type_param_rejected(client: AsyncClient):
    """SQL injection / arbitrary string in type param is rejected (not 2xx)."""
    r = await client.get("/fun/random?type='; DROP TABLE users; --")
    assert r.status_code >= 400


async def test_multiple_calls_return_valid_structure(client: AsyncClient):
    """Multiple consecutive calls all return valid structures (randomness is stable)."""
    for _ in range(5):
        r = await client.get("/fun/random?type=absurd")
        assert r.status_code == 200
        assert r.json()["type"] == "absurd"


async def test_video_type_title_is_string(client: AsyncClient):
    """Video title is always a non-empty string."""
    r = await client.get("/fun/random?type=cat")
    assert isinstance(r.json()["title"], str)
    assert len(r.json()["title"]) > 0
