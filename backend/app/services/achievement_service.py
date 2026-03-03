from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.achievement import AchievementProgress


ACHIEVEMENT_TARGETS = {
    "focus_5": 5,
    "focus_25": 25,
    "focus_100": 100,
    "ignore_break_10": 10,
    "ignore_break_50": 50,
    "absurd_180": 180,
    "absurd_10_sessions": 10,
    "idle_3_days": 3,
    "idle_7_days": 7,
    "balance_perfect_week": 7,
    "balance_50_breaks": 50,
    "complete_100_tasks": 100,
    "complete_500_tasks": 500,
    "early_bird": 10,
    "night_owl": 20,
    "streak_3_days": 3,
    "streak_7_days": 7,
    "streak_30_days": 30,
    "comeback_7_days": 1,
    "relapse_break_streak": 1,
    "ghost_mode_5": 5,
}


async def get_all_achievements(db: AsyncSession, user_id: UUID) -> list[AchievementProgress]:
    result = await db.execute(
        select(AchievementProgress).where(AchievementProgress.user_id == user_id)
    )
    return list(result.scalars().all())


async def update_achievement(
    db: AsyncSession, user_id: UUID, achievement_id: str, value: int
) -> dict:
    target = ACHIEVEMENT_TARGETS.get(achievement_id)
    if not target:
        return {"unlocked_now": False, "achievement_id": None}

    result = await db.execute(
        select(AchievementProgress).where(
            AchievementProgress.user_id == user_id,
            AchievementProgress.achievement_id == achievement_id,
        )
    )
    achievement = result.scalar_one_or_none()

    if achievement is None:
        achievement = AchievementProgress(
            user_id=user_id,
            achievement_id=achievement_id,
            progress=value,
            unlocked=False,
        )
        db.add(achievement)
        await db.flush()
    elif not achievement.unlocked:
        achievement.progress += value

    now_unlocked = achievement.progress >= target
    was_unlocked = achievement.unlocked

    if now_unlocked and not was_unlocked:
        achievement.unlocked = True
        return {"unlocked_now": True, "achievement_id": achievement_id}

    return {"unlocked_now": False, "achievement_id": None}


async def set_achievement_progress(
    db: AsyncSession, user_id: UUID, achievement_id: str, progress: int
) -> dict:
    target = ACHIEVEMENT_TARGETS.get(achievement_id)
    if not target:
        return {"unlocked_now": False, "achievement_id": None}

    result = await db.execute(
        select(AchievementProgress).where(
            AchievementProgress.user_id == user_id,
            AchievementProgress.achievement_id == achievement_id,
        )
    )
    achievement = result.scalar_one_or_none()

    if achievement is None:
        achievement = AchievementProgress(
            user_id=user_id,
            achievement_id=achievement_id,
            progress=progress,
            unlocked=False,
        )
        db.add(achievement)
        await db.flush()
    elif not achievement.unlocked:
        achievement.progress = progress

    now_unlocked = achievement.progress >= target
    was_unlocked = achievement.unlocked

    if now_unlocked and not was_unlocked:
        achievement.unlocked = True
        return {"unlocked_now": True, "achievement_id": achievement_id}

    return {"unlocked_now": False, "achievement_id": None}
