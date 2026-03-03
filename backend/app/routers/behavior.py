from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas.achievement import BehaviorTrackRequest, BehaviorTrackResponse
from app.services.behavior_service import track_ghost_open


router = APIRouter(prefix="/behavior", tags=["behavior"])


@router.post("/ghost/{user_id}", response_model=BehaviorTrackResponse)
async def track_ghost(
    user_id: UUID, request: BehaviorTrackRequest, db: AsyncSession = Depends(get_db)
):
    try:
        unlocked = await track_ghost_open(db, user_id, request.did_user_perform_action)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return {"unlocked_achievements": unlocked}
