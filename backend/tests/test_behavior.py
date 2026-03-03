"""
Tests for POST /behavior/ghost/{user_id}
"""

import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.behavior import Behavior

pytestmark = pytest.mark.asyncio


def uid() -> str:
    return str(uuid.uuid4())


async def ghost(client: AsyncClient, user_id: str, did_action: bool):
    return await client.post(
        f"/behavior/ghost/{user_id}",
        json={"did_user_perform_action": did_action},
    )


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH
# ══════════════════════════════════════════════════════════════════════════════


async def test_ghost_false_creates_behavior_row(client: AsyncClient, db_session: AsyncSession):
    """First ghost=False call creates a Behavior row with ghost_sessions=1."""
    user = uid()
    r = await ghost(client, user, False)
    assert r.status_code == 200

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one_or_none()
    assert behavior is not None
    assert behavior.ghost_sessions == 1
    assert behavior.last_open_date == date.today()


async def test_ghost_true_resets_sessions_to_zero(client: AsyncClient, db_session: AsyncSession):
    """ghost=True resets ghost_sessions to 0."""
    user = uid()
    # Build up some ghost sessions first
    await ghost(client, user, False)
    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()
    behavior.ghost_sessions = 4
    behavior.last_open_date = date.today() - timedelta(days=1)
    await db_session.flush()

    r = await ghost(client, user, True)
    assert r.status_code == 200

    await db_session.refresh(behavior)
    assert behavior.ghost_sessions == 0


async def test_ghost_false_same_day_does_not_increment(client: AsyncClient, db_session: AsyncSession):
    """Two ghost=False calls on the same day only count as one ghost session."""
    user = uid()
    await ghost(client, user, False)
    await ghost(client, user, False)

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()
    assert behavior.ghost_sessions == 1


async def test_ghost_false_next_day_increments(client: AsyncClient, db_session: AsyncSession):
    """ghost=False on a new day increments ghost_sessions."""
    user = uid()
    await ghost(client, user, False)

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()
    behavior.last_open_date = date.today() - timedelta(days=1)
    await db_session.flush()

    await ghost(client, user, False)
    await db_session.refresh(behavior)
    assert behavior.ghost_sessions == 2


async def test_ghost_mode_5_unlocks_at_5_sessions(client: AsyncClient, db_session: AsyncSession):
    """ghost_mode_5 achievement unlocks when ghost_sessions reaches 5."""
    user = uid()
    await ghost(client, user, False)

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()

    # Seed to 4 ghost sessions, then trigger one more on a new day
    behavior.ghost_sessions = 4
    behavior.last_open_date = date.today() - timedelta(days=1)
    await db_session.flush()

    r = await ghost(client, user, False)
    assert r.status_code == 200
    unlocked_ids = [a["achievement_id"] for a in r.json()["unlocked_achievements"]]
    assert "ghost_mode_5" in unlocked_ids


async def test_ghost_true_after_unlock_does_not_re_unlock(client: AsyncClient, db_session: AsyncSession):
    """After ghost_mode_5 unlocks, resetting and re-building does not unlock again."""
    user = uid()
    await ghost(client, user, False)

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()
    behavior.ghost_sessions = 4
    behavior.last_open_date = date.today() - timedelta(days=1)
    await db_session.flush()

    # Unlock
    r1 = await ghost(client, user, False)
    assert any(a["achievement_id"] == "ghost_mode_5" for a in r1.json()["unlocked_achievements"])

    # Reset via action
    await ghost(client, user, True)

    # Build back up to 5 on new days
    behavior.ghost_sessions = 4
    behavior.last_open_date = date.today() - timedelta(days=1)
    await db_session.flush()

    r2 = await ghost(client, user, False)
    # Should NOT unlock again (achievement is already unlocked in DB)
    unlocked_ids = [a["achievement_id"] for a in r2.json()["unlocked_achievements"]]
    assert "ghost_mode_5" not in unlocked_ids


async def test_ghost_response_schema(client: AsyncClient):
    """Response always contains unlocked_achievements list."""
    r = await ghost(client, uid(), False)
    body = r.json()
    assert "unlocked_achievements" in body
    assert isinstance(body["unlocked_achievements"], list)


# ══════════════════════════════════════════════════════════════════════════════
# EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════


async def test_ghost_invalid_uuid(client: AsyncClient):
    """Non-UUID user_id returns 422."""
    r = await client.post("/behavior/ghost/not-a-uuid", json={"did_user_perform_action": False})
    assert r.status_code == 422


async def test_ghost_empty_body(client: AsyncClient):
    """Missing body returns 422."""
    r = await client.post(f"/behavior/ghost/{uid()}", json={})
    assert r.status_code == 422


async def test_ghost_missing_field(client: AsyncClient):
    """Missing did_user_perform_action field returns 422."""
    r = await client.post(f"/behavior/ghost/{uid()}", json={"other": True})
    assert r.status_code == 422


async def test_ghost_wrong_type(client: AsyncClient):
    """
    Pydantic v2 coerces string "yes" to bool True, so the endpoint accepts it
    and returns 200. An integer like 99 is also coerced. Only a truly
    non-coercible value (e.g. a dict) triggers 422.
    """
    r = await client.post(
        f"/behavior/ghost/{uid()}",
        json={"did_user_perform_action": "yes"},
    )
    assert r.status_code == 200

    r2 = await client.post(
        f"/behavior/ghost/{uid()}",
        json={"did_user_perform_action": {"nested": "object"}},
    )
    assert r2.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# EXPLOIT SCENARIOS
# ══════════════════════════════════════════════════════════════════════════════


async def test_spam_ghost_false_same_day_no_inflation(client: AsyncClient, db_session: AsyncSession):
    """
    Spamming ghost=False 50 times in the same day cannot inflate ghost_sessions
    beyond 1 (same-day deduplication guard).
    """
    user = uid()
    for _ in range(50):
        r = await ghost(client, user, False)
        assert r.status_code == 200

    result = await db_session.execute(
        select(Behavior).where(Behavior.user_id == uuid.UUID(user))
    )
    behavior = result.scalar_one()
    assert behavior.ghost_sessions == 1


async def test_alternating_ghost_true_false_no_unlock_exploit(client: AsyncClient, db_session: AsyncSession):
    """
    Alternating ghost=True / ghost=False cannot trigger ghost_mode_5 unlock
    without actually accumulating 5 distinct ghost days.
    """
    user = uid()
    unlock_events = 0

    for _ in range(20):
        r_false = await ghost(client, user, False)
        for a in r_false.json()["unlocked_achievements"]:
            if a["achievement_id"] == "ghost_mode_5":
                unlock_events += 1
        r_true = await ghost(client, user, True)

    # ghost_sessions resets to 0 on every True call, so 5 is never reached
    assert unlock_events == 0
