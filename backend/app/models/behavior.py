from sqlalchemy import Column, Integer, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Behavior(Base):
    __tablename__ = "behavior"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    ghost_sessions = Column(Integer, default=0, nullable=False)
    last_open_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="behavior")
