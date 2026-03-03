from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AchievementProgressBase(BaseModel):
    achievement_id: str
    progress: int
    unlocked: bool


class AchievementProgressResponse(AchievementProgressBase):
    id: UUID
    user_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True


class AchievementUpdateRequest(BaseModel):
    achievement_id: str
    value: int


class AchievementUpdateResponse(BaseModel):
    unlocked_now: bool
    achievement_id: str | None = None


class StreakUpdateResponse(BaseModel):
    unlocked_achievements: list[AchievementUpdateResponse]


class BehaviorTrackRequest(BaseModel):
    did_user_perform_action: bool


class BehaviorTrackResponse(BaseModel):
    unlocked_achievements: list[AchievementUpdateResponse]


class AchievementEventRequest(BaseModel):
    event: str
    metadata: dict | None = None


class AchievementEventResponse(BaseModel):
    unlocked_achievements: list[AchievementUpdateResponse]
