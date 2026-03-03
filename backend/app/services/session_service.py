from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from datetime import date, timedelta
import logging

from app.models.session_history import SessionHistory
from app.models.user import User
from app.services.task_event_service import get_completed_tasks_count

logger = logging.getLogger(__name__)


async def upsert_daily_session(
    db: AsyncSession,
    user_id: UUID,
    focus_minutes: int,
    break_minutes: int,
    session_count: int,
    completed_tasks: int,
) -> SessionHistory:
    """Upsert today's session snapshot."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(id=user_id)
        db.add(user)
        await db.flush()
    
    today = date.today()
    
    result = await db.execute(
        select(SessionHistory).where(
            and_(
                SessionHistory.user_id == user_id,
                SessionHistory.date == today
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.focus_minutes = focus_minutes
        existing.break_minutes = break_minutes
        existing.session_count = session_count
        existing.completed_tasks = completed_tasks
        await db.flush()
        return existing
    else:
        new_session = SessionHistory(
            user_id=user_id,
            date=today,
            focus_minutes=focus_minutes,
            break_minutes=break_minutes,
            session_count=session_count,
            completed_tasks=completed_tasks,
        )
        db.add(new_session)
        await db.flush()
        return new_session


async def get_today_session(
    db: AsyncSession,
    user_id: UUID,
) -> SessionHistory | None:
    """Get today's session for a user."""
    try:
        today = date.today()
        logger.info(f"[GET_TODAY_SESSION] user_id={user_id}, today={today}")
        result = await db.execute(
            select(SessionHistory).where(
                and_(
                    SessionHistory.user_id == user_id,
                    SessionHistory.date == today
                )
            )
        )
        session = result.scalar_one_or_none()
        if session:
            logger.info(f"[GET_TODAY_SESSION] Found session: id={session.id}, completed_tasks={session.completed_tasks}")
        else:
            logger.info(f"[GET_TODAY_SESSION] No session found for today")
        return session
    except Exception as e:
        logger.error(f"[GET_TODAY_SESSION] Error: {e}")
        return None


async def get_session_history(
    db: AsyncSession,
    user_id: UUID,
    days: int,
) -> list[SessionHistory]:
    """Get session history for the last N days."""
    cutoff_date = date.today() - timedelta(days=days - 1)
    
    result = await db.execute(
        select(SessionHistory)
        .where(
            and_(
                SessionHistory.user_id == user_id,
                SessionHistory.date >= cutoff_date
            )
        )
        .order_by(SessionHistory.date.desc())
    )
    
    return list(result.scalars().all())


def calculate_streak(sessions: list[SessionHistory]) -> int:
    """Calculate consecutive days streak from session history."""
    if not sessions:
        return 0
    
    dates_with_sessions = sorted(
        [s.date for s in sessions if s.session_count > 0],
        reverse=True
    )
    
    if not dates_with_sessions:
        return 0
    
    today = date.today()
    if dates_with_sessions[0] != today:
        return 0
    
    streak = 0
    check_date = today
    
    for session_date in dates_with_sessions:
        if session_date == check_date:
            streak += 1
            check_date -= timedelta(days=1)
        elif session_date < check_date:
            break
    
    return streak


async def add_rest_time_to_session(
    db: AsyncSession,
    user_id: UUID,
    rest_minutes: int,
) -> SessionHistory:
    """Add rest time to today's session."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(id=user_id)
        db.add(user)
        await db.flush()
    
    today = date.today()
    
    result = await db.execute(
        select(SessionHistory).where(
            and_(
                SessionHistory.user_id == user_id,
                SessionHistory.date == today
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.rest_minutes += rest_minutes
        await db.flush()
        return existing
    else:
        new_session = SessionHistory(
            user_id=user_id,
            date=today,
            focus_minutes=0,
            break_minutes=0,
            rest_minutes=rest_minutes,
            session_count=0,
            completed_tasks=0,
        )
        db.add(new_session)
        await db.flush()
        return new_session


async def get_aggregated_stats(
    db: AsyncSession,
    user_id: UUID,
    range_type: str,
) -> dict:
    """Get aggregated statistics for weekly or monthly range."""
    try:
        days = 7 if range_type == "weekly" else 30
        
        sessions = await get_session_history(db, user_id, days)
        
        if not sessions:
            return {
                "total_focus_minutes": 0,
                "total_break_minutes": 0,
                "total_rest_minutes": 0,
                "total_sessions": 0,
                "total_completed_tasks": 0,
                "streak": 0,
            }
        
        total_focus_minutes = sum(getattr(s, 'focus_minutes', 0) for s in sessions)
        total_break_minutes = sum(getattr(s, 'break_minutes', 0) for s in sessions)
        total_rest_minutes = sum(getattr(s, 'rest_minutes', 0) for s in sessions)
        total_sessions = sum(getattr(s, 'session_count', 0) for s in sessions)
        
        # Get completed tasks from task_events table
        logger.info(f"[AGGREGATED_STATS] Getting completed tasks count for user_id={user_id}, days={days}")
        total_completed_tasks = await get_completed_tasks_count(db, user_id, days)
        logger.info(f"[AGGREGATED_STATS] total_completed_tasks from task_events: {total_completed_tasks}")
        
        all_sessions = await get_session_history(db, user_id, 365)
        streak = calculate_streak(all_sessions) if all_sessions else 0
        
        return {
            "total_focus_minutes": total_focus_minutes,
            "total_break_minutes": total_break_minutes,
            "total_rest_minutes": total_rest_minutes,
            "total_sessions": total_sessions,
            "total_completed_tasks": total_completed_tasks,
            "streak": streak,
        }
    except Exception as e:
        return {
            "total_focus_minutes": 0,
            "total_break_minutes": 0,
            "total_rest_minutes": 0,
            "total_sessions": 0,
            "total_completed_tasks": 0,
            "streak": 0,
        }
