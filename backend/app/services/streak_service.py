from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import date

from app.models.streak import Streak
from app.utils.date_utils import diff_in_days
from app.services.achievement_service import set_achievement_progress
from app.services.user_service import ensure_user_exists


STREAK_ACHIEVEMENT_IDS = ["streak_3_days", "streak_7_days", "streak_30_days"]


async def update_daily_streak(db: AsyncSession, user_id: UUID) -> list[dict]:
    await ensure_user_exists(db, user_id)
    
    today = date.today()

    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id).with_for_update()
    )
    streak = result.scalar_one_or_none()

    if not streak:
        streak = Streak(user_id=user_id, current_streak=1, last_active_date=today)
        db.add(streak)
        await db.flush()
        
        unlocked = []
        for achievement_id in STREAK_ACHIEVEMENT_IDS:
            result_data = await set_achievement_progress(db, user_id, achievement_id, 1)
            if result_data["unlocked_now"]:
                unlocked.append(result_data)
        
        return unlocked

    previous_last_active_date = streak.last_active_date
    days_diff = diff_in_days(previous_last_active_date, today)

    if days_diff == 0:
        return []

    previous_streak = streak.current_streak
    new_streak = streak.current_streak + 1 if days_diff == 1 else 1

    streak.current_streak = new_streak
    streak.last_active_date = today

    unlocked = []

    for achievement_id in STREAK_ACHIEVEMENT_IDS:
        result_data = await set_achievement_progress(db, user_id, achievement_id, new_streak)
        if result_data["unlocked_now"]:
            unlocked.append(result_data)

    if days_diff >= 7 and previous_last_active_date:
        result_data = await set_achievement_progress(db, user_id, "comeback_7_days", 1)
        if result_data["unlocked_now"]:
            unlocked.append(result_data)

    if previous_streak >= 7 and days_diff > 1:
        result_data = await set_achievement_progress(db, user_id, "relapse_break_streak", 1)
        if result_data["unlocked_now"]:
            unlocked.append(result_data)

    return unlocked
