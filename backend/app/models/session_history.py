from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4

from app.core.database import Base


class SessionHistory(Base):
    __tablename__ = "session_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    focus_minutes = Column(Integer, nullable=False, default=0)
    break_minutes = Column(Integer, nullable=False, default=0)
    rest_minutes = Column(Integer, nullable=False, default=0)
    session_count = Column(Integer, nullable=False, default=0)
    completed_tasks = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="session_history")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
    )
