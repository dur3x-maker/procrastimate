from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    pass


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
