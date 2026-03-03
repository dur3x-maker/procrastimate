from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas.achievement import StreakUpdateResponse
from app.services.streak_service import update_daily_streak


router = APIRouter(prefix="/streak", tags=["streak"])


@router.post("/update/{user_id}", response_model=StreakUpdateResponse)
async def update_streak(user_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        unlocked = await update_daily_streak(db, user_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return {"unlocked_achievements": unlocked}
