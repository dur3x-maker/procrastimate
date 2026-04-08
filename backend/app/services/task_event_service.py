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
    idempotency_key: str | None = None,
    client_session_id: str | None = None,
) -> TaskEvent | None:
    """Record a task_completed event and increment daily stats. Returns None if duplicate."""
    
    logger.info(f"[RECORD_TASK] Starting - user_id={user_id}, task_id={task_id}, idem_key={idempotency_key}")
    
    # Idempotency: check by idempotency_key if provided, else fall back to task_id
    if idempotency_key:
        existing_result = await db.execute(
            select(TaskEvent).where(TaskEvent.idempotency_key == idempotency_key)
        )
    else:
        existing_result = await db.execute(
            select(TaskEvent).where(
                and_(
                    TaskEvent.user_id == user_id,
                    TaskEvent.task_id == task_id,
                    TaskEvent.event_type == "task_completed",
                )
            )
        )
    existing_event = existing_result.scalar_one_or_none()
    if existing_event:
        logger.info(f"[RECORD_TASK] Duplicate skipped - key={idempotency_key or task_id} (event_id={existing_event.id})")
        return None
    
    # Create the event
    event = TaskEvent(
        user_id=user_id,
        task_id=task_id,
        session_id=session_id,
        event_type="task_completed",
        idempotency_key=idempotency_key,
        client_session_id=client_session_id,
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


async def _resolve_paired_event(
    db: AsyncSession,
    user_id: UUID,
    start_type: str,
    end_type: str,
    tag: str,
    client_session_id: str | None = None,
) -> int | None:
    """Generic start/end pairing with server timestamps.
    If client_session_id provided, matches by it. Otherwise falls back to latest unmatched start.
    Returns duration in minutes or None."""

    if client_session_id:
        start_result = await db.execute(
            select(TaskEvent).where(
                and_(
                    TaskEvent.user_id == user_id,
                    TaskEvent.event_type == start_type,
                    TaskEvent.client_session_id == client_session_id,
                )
            ).order_by(TaskEvent.created_at.desc()).limit(1)
        )
    else:
        start_result = await db.execute(
            select(TaskEvent).where(
                and_(
                    TaskEvent.user_id == user_id,
                    TaskEvent.event_type == start_type,
                )
            ).order_by(TaskEvent.created_at.desc()).limit(1)
        )
    start_event = start_result.scalar_one_or_none()

    if not start_event:
        logger.warning(f"[{tag}] No {start_type} found for user {user_id} (csid={client_session_id})")
        return None

    # Check if already matched
    end_filter = [
        TaskEvent.user_id == user_id,
        TaskEvent.event_type == end_type,
        TaskEvent.created_at > start_event.created_at,
    ]
    if client_session_id:
        end_filter.append(TaskEvent.client_session_id == client_session_id)
    end_check = await db.execute(select(TaskEvent).where(and_(*end_filter)))
    if end_check.scalar_one_or_none():
        logger.info(f"[{tag}] {start_type} already matched, duplicate skipped")
        return None

    # Record end event
    end_event = TaskEvent(
        user_id=user_id,
        task_id=start_event.task_id,
        event_type=end_type,
        client_session_id=client_session_id,
    )
    db.add(end_event)
    await db.flush()

    end_time = datetime.now(start_event.created_at.tzinfo) if start_event.created_at.tzinfo else datetime.utcnow()
    duration_seconds = (end_time - start_event.created_at).total_seconds()
    minutes = max(0, int(duration_seconds / 60))

    logger.info(
        f"[{tag}] minutes={minutes} "
        f"(start={start_event.created_at}, end={end_time}, duration={duration_seconds:.0f}s, csid={client_session_id})"
    )
    return minutes


async def record_break_start(
    db: AsyncSession,
    user_id: UUID,
    client_session_id: str | None = None,
) -> TaskEvent:
    """Record a break_start event with server timestamp."""
    event = TaskEvent(
        user_id=user_id,
        task_id="break",
        event_type="break_start",
        client_session_id=client_session_id,
    )
    db.add(event)
    await db.flush()
    logger.info(f"[BREAK_START] Recorded: id={event.id}, csid={client_session_id}")
    return event


async def resolve_break_end(
    db: AsyncSession,
    user_id: UUID,
    client_session_id: str | None = None,
) -> int | None:
    """Match break_start by client_session_id, calculate break_minutes. Min 1 minute."""
    minutes = await _resolve_paired_event(db, user_id, "break_start", "break_end", "BREAK_END", client_session_id)
    if minutes is not None:
        return max(1, minutes)
    return None


async def record_session_start(
    db: AsyncSession,
    user_id: UUID,
    client_session_id: str | None = None,
) -> TaskEvent:
    """Record a session_start event with server timestamp."""
    event = TaskEvent(
        user_id=user_id,
        task_id="session",
        event_type="session_start",
        client_session_id=client_session_id,
    )
    db.add(event)
    await db.flush()
    logger.info(f"[SESSION_START] Recorded: id={event.id}, csid={client_session_id}")
    return event


async def resolve_session_end(
    db: AsyncSession,
    user_id: UUID,
    client_session_id: str | None = None,
) -> int | None:
    """Match session_start by client_session_id, calculate focus_minutes."""
    return await _resolve_paired_event(db, user_id, "session_start", "session_end", "SESSION_END", client_session_id)


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
