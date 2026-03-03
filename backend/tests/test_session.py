import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date, timedelta


@pytest.fixture
def test_user_id():
    return uuid4()


async def test_save_daily_session_creates_new_record(client: AsyncClient, test_user_id):
    """POST /sessions/daily creates a new session record."""
    payload = {
        "focus_minutes": 120,
        "break_minutes": 30,
        "session_count": 3,
        "completed_tasks": 5,
    }
    
    r = await client.post(f"/sessions/daily/{test_user_id}", json=payload)
    
    if r.status_code != 200:
        print(f"Error: {r.status_code}")
        print(f"Response: {r.text}")
    
    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == str(test_user_id)
    assert body["date"] == date.today().isoformat()
    assert body["focus_minutes"] == 120
    assert body["break_minutes"] == 30
    assert body["session_count"] == 3
    assert body["completed_tasks"] == 5


async def test_save_daily_session_upserts_existing_record(client: AsyncClient, test_user_id):
    """POST /sessions/daily updates existing record for today."""
    payload1 = {
        "focus_minutes": 60,
        "break_minutes": 15,
        "session_count": 2,
        "completed_tasks": 3,
    }
    
    r1 = await client.post(f"/sessions/daily/{test_user_id}", json=payload1)
    assert r1.status_code == 200
    first_id = r1.json()["id"]
    
    payload2 = {
        "focus_minutes": 120,
        "break_minutes": 30,
        "session_count": 4,
        "completed_tasks": 6,
    }
    
    r2 = await client.post(f"/sessions/daily/{test_user_id}", json=payload2)
    assert r2.status_code == 200
    body = r2.json()
    
    assert body["id"] == first_id
    assert body["focus_minutes"] == 120
    assert body["break_minutes"] == 30
    assert body["session_count"] == 4
    assert body["completed_tasks"] == 6


async def test_get_weekly_history_empty(client: AsyncClient, test_user_id):
    """GET /sessions/history returns zeros when no data exists."""
    r = await client.get(f"/sessions/history/{test_user_id}?range=weekly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["total_focus_minutes"] == 0
    assert body["total_break_minutes"] == 0
    assert body["total_sessions"] == 0
    assert body["total_completed_tasks"] == 0
    assert body["streak"] == 0


async def test_get_weekly_history_aggregates_correctly(client: AsyncClient, test_user_id):
    """GET /sessions/history aggregates weekly data correctly."""
    await client.post(f"/sessions/daily/{test_user_id}", json={
        "focus_minutes": 60,
        "break_minutes": 15,
        "session_count": 2,
        "completed_tasks": 3,
    })
    
    r = await client.get(f"/sessions/history/{test_user_id}?range=weekly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["total_focus_minutes"] == 60
    assert body["total_break_minutes"] == 15
    assert body["total_sessions"] == 2
    assert body["total_completed_tasks"] == 3


async def test_get_monthly_history_aggregates_correctly(client: AsyncClient, test_user_id):
    """GET /sessions/history aggregates monthly data correctly."""
    await client.post(f"/sessions/daily/{test_user_id}", json={
        "focus_minutes": 120,
        "break_minutes": 30,
        "session_count": 4,
        "completed_tasks": 6,
    })
    
    r = await client.get(f"/sessions/history/{test_user_id}?range=monthly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["total_focus_minutes"] == 120
    assert body["total_break_minutes"] == 30
    assert body["total_sessions"] == 4
    assert body["total_completed_tasks"] == 6


async def test_streak_calculation_requires_today(client: AsyncClient, test_user_id):
    """Streak is 0 if no session today."""
    r = await client.get(f"/sessions/history/{test_user_id}?range=weekly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["streak"] == 0


async def test_streak_calculation_single_day(client: AsyncClient, test_user_id):
    """Streak is 1 when only today has sessions."""
    await client.post(f"/sessions/daily/{test_user_id}", json={
        "focus_minutes": 60,
        "break_minutes": 15,
        "session_count": 2,
        "completed_tasks": 3,
    })
    
    r = await client.get(f"/sessions/history/{test_user_id}?range=weekly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["streak"] == 1


async def test_streak_requires_session_count_greater_than_zero(client: AsyncClient, test_user_id):
    """Streak ignores days with session_count = 0."""
    await client.post(f"/sessions/daily/{test_user_id}", json={
        "focus_minutes": 0,
        "break_minutes": 0,
        "session_count": 0,
        "completed_tasks": 0,
    })
    
    r = await client.get(f"/sessions/history/{test_user_id}?range=weekly")
    
    assert r.status_code == 200
    body = r.json()
    assert body["streak"] == 0


async def test_invalid_range_returns_400(client: AsyncClient, test_user_id):
    """Invalid range parameter returns 400."""
    r = await client.get(f"/sessions/history/{test_user_id}?range=yearly")
    
    assert r.status_code == 400


async def test_multiple_users_isolated(client: AsyncClient):
    """Different users have isolated session data."""
    user1 = uuid4()
    user2 = uuid4()
    
    await client.post(f"/sessions/daily/{user1}", json={
        "focus_minutes": 60,
        "break_minutes": 15,
        "session_count": 2,
        "completed_tasks": 3,
    })
    
    await client.post(f"/sessions/daily/{user2}", json={
        "focus_minutes": 90,
        "break_minutes": 20,
        "session_count": 3,
        "completed_tasks": 4,
    })
    
    r1 = await client.get(f"/sessions/history/{user1}?range=weekly")
    r2 = await client.get(f"/sessions/history/{user2}?range=weekly")
    
    assert r1.status_code == 200
    assert r2.status_code == 200
    
    body1 = r1.json()
    body2 = r2.json()
    
    assert body1["total_focus_minutes"] == 60
    assert body2["total_focus_minutes"] == 90


async def test_zero_values_accepted(client: AsyncClient, test_user_id):
    """Zero values are valid for all fields."""
    payload = {
        "focus_minutes": 0,
        "break_minutes": 0,
        "session_count": 0,
        "completed_tasks": 0,
    }
    
    r = await client.post(f"/sessions/daily/{test_user_id}", json=payload)
    
    assert r.status_code == 200
    body = r.json()
    assert body["focus_minutes"] == 0
    assert body["break_minutes"] == 0
    assert body["session_count"] == 0
    assert body["completed_tasks"] == 0


async def test_large_values_accepted(client: AsyncClient, test_user_id):
    """Large values are accepted."""
    payload = {
        "focus_minutes": 1440,
        "break_minutes": 480,
        "session_count": 50,
        "completed_tasks": 100,
    }
    
    r = await client.post(f"/sessions/daily/{test_user_id}", json=payload)
    
    assert r.status_code == 200
    body = r.json()
    assert body["focus_minutes"] == 1440
    assert body["break_minutes"] == 480
    assert body["session_count"] == 50
    assert body["completed_tasks"] == 100
