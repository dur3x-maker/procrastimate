from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import date

from app.models.behavior import Behavior
from app.services.achievement_service import set_achievement_progress
from app.services.user_service import ensure_user_exists


async def track_ghost_open(
    db: AsyncSession, user_id: UUID, did_user_perform_action: bool
) -> list[dict]:
    await ensure_user_exists(db, user_id)
    
    today = date.today()

    result = await db.execute(
        select(Behavior).where(Behavior.user_id == user_id).with_for_update()
    )
    behavior = result.scalar_one_or_none()

    if not behavior:
        behavior = Behavior(user_id=user_id, ghost_sessions=0, last_open_date=None)
        db.add(behavior)
        await db.flush()

    previous_ghost_sessions = behavior.ghost_sessions

    if did_user_perform_action:
        behavior.ghost_sessions = 0
    else:
        if behavior.last_open_date == today:
            pass
        else:
            behavior.ghost_sessions += 1

    behavior.last_open_date = today

    unlocked = []

    if behavior.ghost_sessions >= 5 and previous_ghost_sessions < 5:
        result_data = await set_achievement_progress(db, user_id, "ghost_mode_5", behavior.ghost_sessions)
        if result_data["unlocked_now"]:
            unlocked.append(result_data)

    return unlocked
