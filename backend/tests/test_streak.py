"""
Tests for POST /streak/update/{user_id}
"""

import uuid
from datetime import date, timedelta
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.streak import Streak

pytestmark = pytest.mark.asyncio


def uid() -> str:
    return str(uuid.uuid4())


async def update_streak(client: AsyncClient, user_id: str):
    return await client.post(f"/streak/update/{user_id}")


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH
# ══════════════════════════════════════════════════════════════════════════════


async def test_first_streak_call_returns_streak_1(client: AsyncClient, db_session: AsyncSession):
    """First call creates streak row with current_streak=1."""
    user = uid()
    r = await update_streak(client, user)
    assert r.status_code == 200
    assert "unlocked_achievements" in r.json()

    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one_or_none()
    assert streak is not None
    assert streak.current_streak == 1
    assert streak.last_active_date == date.today()


async def test_same_day_call_does_not_increment_streak(client: AsyncClient, db_session: AsyncSession):
    """Two calls on the same day: streak stays at 1, returns empty unlocked list."""
    user = uid()
    await update_streak(client, user)
    r = await update_streak(client, user)
    assert r.status_code == 200
    assert r.json()["unlocked_achievements"] == []

    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    assert streak.current_streak == 1


async def test_consecutive_day_increments_streak(client: AsyncClient, db_session: AsyncSession):
    """Calling on day N then day N+1 increments streak to 2."""
    user = uid()
    yesterday = date.today() - timedelta(days=1)

    # Seed streak as if user called yesterday
    await update_streak(client, user)
    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    streak.last_active_date = yesterday
    await db_session.flush()

    # Call today
    r = await update_streak(client, user)
    assert r.status_code == 200

    await db_session.refresh(streak)
    assert streak.current_streak == 2
    assert streak.last_active_date == date.today()


async def test_gap_resets_streak_to_1(client: AsyncClient, db_session: AsyncSession):
    """A gap of 2+ days resets streak to 1."""
    user = uid()
    two_days_ago = date.today() - timedelta(days=2)

    await update_streak(client, user)
    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    streak.last_active_date = two_days_ago
    streak.current_streak = 5
    await db_session.flush()

    r = await update_streak(client, user)
    assert r.status_code == 200

    await db_session.refresh(streak)
    assert streak.current_streak == 1


async def test_streak_3_days_unlocks(client: AsyncClient, db_session: AsyncSession):
    """Reaching streak=3 unlocks streak_3_days achievement."""
    user = uid()

    # Simulate 3 consecutive days by seeding last_active_date
    await update_streak(client, user)
    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()

    for day_offset in [2, 1]:
        streak.last_active_date = date.today() - timedelta(days=day_offset)
        streak.current_streak = 3 - day_offset
        await db_session.flush()
        r = await update_streak(client, user)
        assert r.status_code == 200

    await db_session.refresh(streak)
    assert streak.current_streak == 3


async def test_comeback_7_days_unlocks_after_gap(client: AsyncClient, db_session: AsyncSession):
    """comeback_7_days achievement triggers when gap >= 7 days."""
    user = uid()
    await update_streak(client, user)

    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    streak.last_active_date = date.today() - timedelta(days=8)
    streak.current_streak = 3
    await db_session.flush()

    r = await update_streak(client, user)
    assert r.status_code == 200
    unlocked_ids = [a["achievement_id"] for a in r.json()["unlocked_achievements"]]
    assert "comeback_7_days" in unlocked_ids


async def test_relapse_break_streak_unlocks(client: AsyncClient, db_session: AsyncSession):
    """relapse_break_streak triggers when previous streak >= 7 and gap > 1."""
    user = uid()
    await update_streak(client, user)

    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    streak.last_active_date = date.today() - timedelta(days=3)
    streak.current_streak = 7
    await db_session.flush()

    r = await update_streak(client, user)
    assert r.status_code == 200
    unlocked_ids = [a["achievement_id"] for a in r.json()["unlocked_achievements"]]
    assert "relapse_break_streak" in unlocked_ids


# ══════════════════════════════════════════════════════════════════════════════
# EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════


async def test_streak_invalid_uuid(client: AsyncClient):
    """Non-UUID user_id returns 422."""
    r = await client.post("/streak/update/not-a-uuid")
    assert r.status_code == 422


async def test_streak_response_schema(client: AsyncClient):
    """Response always contains unlocked_achievements list."""
    r = await update_streak(client, uid())
    body = r.json()
    assert isinstance(body["unlocked_achievements"], list)


# ══════════════════════════════════════════════════════════════════════════════
# EXPLOIT SCENARIOS
# ══════════════════════════════════════════════════════════════════════════════


async def test_spam_streak_same_day_no_increment(client: AsyncClient, db_session: AsyncSession):
    """
    Spamming /streak/update 20 times in the same day cannot inflate streak.
    Streak must remain at 1.
    """
    user = uid()
    for _ in range(20):
        r = await update_streak(client, user)
        assert r.status_code == 200

    result = await db_session.execute(
        select(Streak).where(Streak.user_id == uuid.UUID(user))
    )
    streak = result.scalar_one()
    assert streak.current_streak == 1
