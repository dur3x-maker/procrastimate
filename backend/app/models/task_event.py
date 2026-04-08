from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class TaskEvent(Base):
    __tablename__ = "task_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("session_history.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String, nullable=False)  # "task_completed", "session_start", etc.
    idempotency_key = Column(String, unique=True, nullable=True, index=True)
    client_session_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
    session = relationship("SessionHistory")
