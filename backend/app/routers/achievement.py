from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas.achievement import (
    AchievementProgressResponse,
    AchievementUpdateRequest,
    AchievementUpdateResponse,
    AchievementEventRequest,
    AchievementEventResponse,
)
from app.services.achievement_service import get_all_achievements, update_achievement
from app.services.achievement_event_service import trigger_achievement_event
from app.services.user_service import ensure_user_exists


router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/{user_id}", response_model=list[AchievementProgressResponse])
async def get_achievements(user_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        achievements = await get_all_achievements(db, user_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return achievements


@router.post("/update/{user_id}", response_model=AchievementUpdateResponse)
async def update_achievement_endpoint(
    user_id: UUID, request: AchievementUpdateRequest, db: AsyncSession = Depends(get_db)
):
    try:
        await ensure_user_exists(db, user_id)
        result = await update_achievement(db, user_id, request.achievement_id, request.value)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return result


@router.post("/trigger-event/{user_id}", response_model=AchievementEventResponse)
async def trigger_event_endpoint(
    user_id: UUID, request: AchievementEventRequest, db: AsyncSession = Depends(get_db)
):
    try:
        await ensure_user_exists(db, user_id)
        unlocked = await trigger_achievement_event(
            db, user_id, request.event, request.metadata or {}
        )
        await db.commit()
        return {"unlocked_achievements": unlocked}
    except Exception:
        await db.rollback()
        raise
