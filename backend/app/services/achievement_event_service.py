from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import logging

from app.models.achievement import AchievementProgress
from app.services.task_event_service import record_task_completed

logger = logging.getLogger(__name__)


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


EVENT_TO_ACHIEVEMENTS = {
    "task_completed": ["complete_100_tasks", "complete_500_tasks"],
    "session_ended": ["focus_5", "focus_25", "focus_100"],
    "session_ended_no_breaks": ["absurd_10_sessions"],
    "session_ended_early_bird": ["early_bird"],
    "session_ended_night_owl": ["night_owl"],
    "break_ignored": ["ignore_break_10", "ignore_break_50"],
    "break_taken": ["balance_50_breaks"],
    "rest_added": ["balance_50_breaks"],
    "idle_day": ["idle_3_days", "idle_7_days"],
    "streak_updated": ["streak_3_days", "streak_7_days", "streak_30_days"],
    "absurd_mode_minutes": ["absurd_180"],
}


async def _increment_achievement(
    db: AsyncSession,
    user_id: UUID,
    achievement_id: str,
    increment: int = 1
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
            progress=increment,
            unlocked=False,
        )
        db.add(achievement)
        await db.flush()
    elif not achievement.unlocked:
        achievement.progress += increment

    now_unlocked = achievement.progress >= target
    was_unlocked = achievement.unlocked

    if now_unlocked and not was_unlocked:
        achievement.unlocked = True
        return {"unlocked_now": True, "achievement_id": achievement_id}

    return {"unlocked_now": False, "achievement_id": None}


async def trigger_achievement_event(
    db: AsyncSession,
    user_id: UUID,
    event: str,
    metadata: dict = None
) -> list[dict]:
    unlocked = []
    
    if event == "task_completed":
        # Record the task completion event
        task_id = metadata.get("task_id") if metadata else None
        session_id = metadata.get("session_id") if metadata else None
        logger.info(f"[TASK_COMPLETED] user_id={user_id}, task_id={task_id}, session_id={session_id}")
        if task_id:
            event_record = await record_task_completed(db, user_id, task_id, session_id)
            logger.info(f"[TASK_COMPLETED] Event recorded: event_id={event_record.id}")
        else:
            logger.warning(f"[TASK_COMPLETED] No task_id provided in metadata for user {user_id}")
        
        for achievement_id in EVENT_TO_ACHIEVEMENTS.get("task_completed", []):
            result = await _increment_achievement(db, user_id, achievement_id, 1)
            if result["unlocked_now"]:
                unlocked.append(result)
    
    elif event == "session_ended":
        for achievement_id in EVENT_TO_ACHIEVEMENTS.get("session_ended", []):
            result = await _increment_achievement(db, user_id, achievement_id, 1)
            if result["unlocked_now"]:
                unlocked.append(result)
        
        if metadata and metadata.get("no_breaks"):
            for achievement_id in EVENT_TO_ACHIEVEMENTS.get("session_ended_no_breaks", []):
                result = await _increment_achievement(db, user_id, achievement_id, 1)
                if result["unlocked_now"]:
                    unlocked.append(result)
        
        if metadata and metadata.get("hour"):
            hour = metadata["hour"]
            if hour < 7:
                for achievement_id in EVENT_TO_ACHIEVEMENTS.get("session_ended_early_bird", []):
                    result = await _increment_achievement(db, user_id, achievement_id, 1)
                    if result["unlocked_now"]:
                        unlocked.append(result)
            elif hour >= 22:
                for achievement_id in EVENT_TO_ACHIEVEMENTS.get("session_ended_night_owl", []):
                    result = await _increment_achievement(db, user_id, achievement_id, 1)
                    if result["unlocked_now"]:
                        unlocked.append(result)
    
    elif event == "break_ignored":
        for achievement_id in EVENT_TO_ACHIEVEMENTS.get("break_ignored", []):
            result = await _increment_achievement(db, user_id, achievement_id, 1)
            if result["unlocked_now"]:
                unlocked.append(result)
    
    elif event == "break_taken":
        for achievement_id in EVENT_TO_ACHIEVEMENTS.get("break_taken", []):
            result = await _increment_achievement(db, user_id, achievement_id, 1)
            if result["unlocked_now"]:
                unlocked.append(result)
    
    elif event == "rest_added":
        for achievement_id in EVENT_TO_ACHIEVEMENTS.get("rest_added", []):
            result = await _increment_achievement(db, user_id, achievement_id, 1)
            if result["unlocked_now"]:
                unlocked.append(result)
    
    return unlocked
