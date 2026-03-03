"""
Tests for GET /achievements/{user_id} and POST /achievements/update/{user_id}
"""

import uuid
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ── helpers ────────────────────────────────────────────────────────────────────

def uid() -> str:
    return str(uuid.uuid4())


async def update(client: AsyncClient, user_id: str, achievement_id: str, value: int):
    return await client.post(
        f"/achievements/update/{user_id}",
        json={"achievement_id": achievement_id, "value": value},
    )


async def get_achievements(client: AsyncClient, user_id: str):
    return await client.get(f"/achievements/{user_id}")


# ══════════════════════════════════════════════════════════════════════════════
# HAPPY PATH
# ══════════════════════════════════════════════════════════════════════════════


async def test_new_user_has_no_achievements(client: AsyncClient):
    """GET for a brand-new user returns an empty list."""
    r = await get_achievements(client, uid())
    assert r.status_code == 200
    assert r.json() == []


async def test_update_creates_achievement_record(client: AsyncClient):
    """First update creates a record with progress = value."""
    user = uid()
    r = await update(client, user, "focus_5", 1)
    assert r.status_code == 200
    body = r.json()
    assert "unlocked_now" in body

    achievements = (await get_achievements(client, user)).json()
    assert len(achievements) == 1
    assert achievements[0]["achievement_id"] == "focus_5"
    assert achievements[0]["progress"] == 1
    assert achievements[0]["unlocked"] is False


async def test_update_accumulates_progress(client: AsyncClient):
    """Repeated updates accumulate progress (UPSERT adds, not replaces)."""
    user = uid()
    for _ in range(3):
        await update(client, user, "focus_5", 1)

    achievements = (await get_achievements(client, user)).json()
    rec = next(a for a in achievements if a["achievement_id"] == "focus_5")
    assert rec["progress"] == 3


async def test_update_does_not_create_duplicate(client: AsyncClient):
    """Multiple updates for same (user, achievement) never create two rows."""
    user = uid()
    for _ in range(5):
        await update(client, user, "focus_5", 1)

    achievements = (await get_achievements(client, user)).json()
    focus_records = [a for a in achievements if a["achievement_id"] == "focus_5"]
    assert len(focus_records) == 1


async def test_achievement_unlocks_at_target(client: AsyncClient):
    """Achievement unlocks exactly when progress reaches target (focus_5 target=5)."""
    user = uid()
    for i in range(4):
        r = await update(client, user, "focus_5", 1)
        assert r.json()["unlocked_now"] is False

    r = await update(client, user, "focus_5", 1)
    assert r.json()["unlocked_now"] is True
    assert r.json()["achievement_id"] == "focus_5"


async def test_achievement_unlocks_only_once(client: AsyncClient):
    """After unlock, further updates return unlocked_now=False (no double-unlock)."""
    user = uid()
    for _ in range(5):
        await update(client, user, "focus_5", 1)

    r = await update(client, user, "focus_5", 1)
    assert r.json()["unlocked_now"] is False


async def test_multiple_achievements_independent(client: AsyncClient):
    """Different achievement_ids are tracked independently per user."""
    user = uid()
    await update(client, user, "focus_5", 2)
    await update(client, user, "ignore_break_10", 3)

    achievements = (await get_achievements(client, user)).json()
    ids = {a["achievement_id"]: a["progress"] for a in achievements}
    assert ids["focus_5"] == 2
    assert ids["ignore_break_10"] == 3


# ══════════════════════════════════════════════════════════════════════════════
# EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════


async def test_get_achievements_invalid_uuid(client: AsyncClient):
    """Non-UUID path param returns 422 Unprocessable Entity."""
    r = await client.get("/achievements/not-a-uuid")
    assert r.status_code == 422


async def test_update_invalid_uuid(client: AsyncClient):
    """Non-UUID user_id in update returns 422."""
    r = await client.post(
        "/achievements/update/not-a-uuid",
        json={"achievement_id": "focus_5", "value": 1},
    )
    assert r.status_code == 422


async def test_update_unknown_achievement_id(client: AsyncClient):
    """Unknown achievement_id returns 200 with unlocked_now=False (graceful no-op)."""
    user = uid()
    r = await update(client, user, "nonexistent_achievement", 1)
    assert r.status_code == 200
    assert r.json()["unlocked_now"] is False


async def test_update_empty_body(client: AsyncClient):
    """Missing body fields return 422."""
    r = await client.post(f"/achievements/update/{uid()}", json={})
    assert r.status_code == 422


async def test_update_missing_value_field(client: AsyncClient):
    """Missing value field returns 422."""
    r = await client.post(
        f"/achievements/update/{uid()}",
        json={"achievement_id": "focus_5"},
    )
    assert r.status_code == 422


async def test_update_very_large_value(client: AsyncClient):
    """Very large value is accepted and stored without overflow."""
    user = uid()
    r = await update(client, user, "complete_100_tasks", 999_999)
    assert r.status_code == 200
    achievements = (await get_achievements(client, user)).json()
    rec = next(a for a in achievements if a["achievement_id"] == "complete_100_tasks")
    assert rec["progress"] == 999_999


async def test_update_zero_value(client: AsyncClient):
    """Value=0 is accepted; progress stays at 0."""
    user = uid()
    r = await update(client, user, "focus_5", 0)
    assert r.status_code == 200


async def test_update_negative_value(client: AsyncClient):
    """Negative value is accepted by the API (no schema validation blocks it)."""
    user = uid()
    r = await update(client, user, "focus_5", -1)
    assert r.status_code == 200


async def test_two_users_same_achievement_isolated(client: AsyncClient):
    """Two different users' progress for the same achievement_id is isolated."""
    user_a = uid()
    user_b = uid()
    for _ in range(3):
        await update(client, user_a, "focus_5", 1)
    await update(client, user_b, "focus_5", 1)

    ach_a = (await get_achievements(client, user_a)).json()
    ach_b = (await get_achievements(client, user_b)).json()

    prog_a = next(a["progress"] for a in ach_a if a["achievement_id"] == "focus_5")
    prog_b = next(a["progress"] for a in ach_b if a["achievement_id"] == "focus_5")

    assert prog_a == 3
    assert prog_b == 1


# ══════════════════════════════════════════════════════════════════════════════
# EXPLOIT / SECURITY SCENARIOS
# ══════════════════════════════════════════════════════════════════════════════


async def test_spam_updates_cannot_double_unlock(client: AsyncClient):
    """
    Sending 20 rapid updates cannot unlock the achievement more than once.
    unlocked_now=True must appear exactly once across all responses.
    """
    user = uid()
    unlock_events = 0
    for _ in range(20):
        r = await update(client, user, "focus_5", 1)
        if r.json()["unlocked_now"]:
            unlock_events += 1

    assert unlock_events == 1


async def test_post_unlock_updates_ignored_for_progress(client: AsyncClient):
    """
    After unlock, the UPSERT WHERE unlocked=False condition means further
    updates do NOT increment progress (the row is frozen).
    """
    user = uid()
    # unlock focus_5 (target=5)
    for _ in range(5):
        await update(client, user, "focus_5", 1)

    # try to push more progress
    for _ in range(10):
        await update(client, user, "focus_5", 1)

    achievements = (await get_achievements(client, user)).json()
    rec = next(a for a in achievements if a["achievement_id"] == "focus_5")
    # progress should be frozen at 5 (or whatever was at unlock time)
    assert rec["progress"] == 5
    assert rec["unlocked"] is True
