from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.services.session_service import (
    upsert_daily_session,
    get_aggregated_stats,
    get_today_session,
)
from app.models.session_history import SessionHistory


router = APIRouter(prefix="/sessions", tags=["sessions"])


class DailySessionRequest(BaseModel):
    focus_minutes: int
    break_minutes: int
    session_count: int


class RestTimeRequest(BaseModel):
    rest_seconds: int


class DailySessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    date: str
    focus_minutes: int
    break_minutes: int
    rest_minutes: int
    session_count: int
    completed_tasks: int

    class Config:
        from_attributes = True


class AggregatedStatsResponse(BaseModel):
    total_focus_minutes: int
    total_break_minutes: int
    total_rest_minutes: int
    total_sessions: int
    total_completed_tasks: int
    streak: int


@router.post("/daily/{user_id}", response_model=DailySessionResponse)
async def save_daily_session(
    user_id: UUID,
    payload: DailySessionRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Get current completed_tasks from session_history (managed by task_events)
        result = await db.execute(
            select(SessionHistory).where(
                and_(
                    SessionHistory.user_id == user_id,
                    SessionHistory.date == date.today()
                )
            )
        )
        existing = result.scalar_one_or_none()
        current_completed_tasks = existing.completed_tasks if existing else 0
        
        session = await upsert_daily_session(
            db,
            user_id,
            payload.focus_minutes,
            payload.break_minutes,
            payload.session_count,
            current_completed_tasks,
        )
        await db.commit()
        await db.refresh(session)
        
        return DailySessionResponse(
            id=session.id,
            user_id=session.user_id,
            date=session.date.isoformat(),
            focus_minutes=session.focus_minutes,
            break_minutes=session.break_minutes,
            rest_minutes=session.rest_minutes,
            session_count=session.session_count,
            completed_tasks=session.completed_tasks,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rest/{user_id}")
async def add_rest_time(
    user_id: UUID,
    payload: RestTimeRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        from app.services.session_service import add_rest_time_to_session
        
        rest_minutes = payload.rest_seconds // 60
        if rest_minutes == 0:
            rest_minutes = 1
        
        session = await add_rest_time_to_session(db, user_id, rest_minutes)
        await db.commit()
        await db.refresh(session)
        
        return DailySessionResponse(
            id=session.id,
            user_id=session.user_id,
            date=session.date.isoformat(),
            focus_minutes=session.focus_minutes,
            break_minutes=session.break_minutes,
            rest_minutes=session.rest_minutes,
            session_count=session.session_count,
            completed_tasks=session.completed_tasks,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily/{user_id}", response_model=DailySessionResponse | None)
async def get_daily_session(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    try:
        session = await get_today_session(db, user_id)
        await db.commit()
        
        if not session:
            return None
        
        return DailySessionResponse(
            id=session.id,
            user_id=session.user_id,
            date=session.date.isoformat(),
            focus_minutes=session.focus_minutes,
            break_minutes=session.break_minutes,
            rest_minutes=getattr(session, 'rest_minutes', 0),
            session_count=session.session_count,
            completed_tasks=session.completed_tasks,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{user_id}", response_model=AggregatedStatsResponse)
async def get_session_history(
    user_id: UUID,
    range: str = "weekly",
    db: AsyncSession = Depends(get_db)
):
    if range not in ["weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="range must be 'weekly' or 'monthly'")
    
    try:
        stats = await get_aggregated_stats(db, user_id, range)
        await db.commit()
        return AggregatedStatsResponse(**stats)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
