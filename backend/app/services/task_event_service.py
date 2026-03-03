from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
from datetime import date, datetime, timedelta
import logging

from app.models.task_event import TaskEvent
from app.models.session_history import SessionHistory

logger = logging.getLogger(__name__)


async def record_task_completed(
    db: AsyncSession,
    user_id: UUID,
    task_id: str,
    session_id: UUID | None = None,
) -> TaskEvent:
    """Record a task_completed event and increment daily stats."""
    
    logger.info(f"[RECORD_TASK] Starting - user_id={user_id}, task_id={task_id}, session_id={session_id}")
    
    # Create the event
    event = TaskEvent(
        user_id=user_id,
        task_id=task_id,
        session_id=session_id,
        event_type="task_completed",
    )
    db.add(event)
    await db.flush()
    logger.info(f"[RECORD_TASK] TaskEvent created: id={event.id}, created_at={event.created_at}")
    
    # Increment completed_tasks in today's session_history
    today = date.today()
    logger.info(f"[RECORD_TASK] Today's date: {today}")
    
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
        old_value = session.completed_tasks
        session.completed_tasks += 1
        await db.flush()
        logger.info(f"[RECORD_TASK] Updated existing session: id={session.id}, completed_tasks: {old_value} -> {session.completed_tasks}")
    else:
        # Create a new session record if it doesn't exist
        new_session = SessionHistory(
            user_id=user_id,
            date=today,
            focus_minutes=0,
            break_minutes=0,
            rest_minutes=0,
            session_count=0,
            completed_tasks=1,
        )
        db.add(new_session)
        await db.flush()
        logger.info(f"[RECORD_TASK] Created new session: id={new_session.id}, completed_tasks=1")
    
    return event


async def get_completed_tasks_count(
    db: AsyncSession,
    user_id: UUID,
    days: int = 7,
) -> int:
    """Get count of task_completed events for the last N days."""
    cutoff_date = datetime.now() - timedelta(days=days)
    logger.info(f"[COUNT_TASKS] user_id={user_id}, days={days}, cutoff_date={cutoff_date}")
    
    result = await db.execute(
        select(func.count(TaskEvent.id)).where(
            and_(
                TaskEvent.user_id == user_id,
                TaskEvent.event_type == "task_completed",
                TaskEvent.created_at >= cutoff_date
            )
        )
    )
    count = result.scalar() or 0
    logger.info(f"[COUNT_TASKS] Found {count} task_completed events")
    return count


async def get_completed_tasks_today(
    db: AsyncSession,
    user_id: UUID,
) -> int:
    """Get count of task_completed events for today."""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(func.count(TaskEvent.id)).where(
            and_(
                TaskEvent.user_id == user_id,
                TaskEvent.event_type == "task_completed",
                TaskEvent.created_at >= today_start
            )
        )
    )
    return result.scalar() or 0
