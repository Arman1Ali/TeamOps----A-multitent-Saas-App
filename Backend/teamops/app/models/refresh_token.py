from datetime import datetime
from app.db.base_class import Base

from sqlalchemy import DateTime, String, func, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(
         primary_key=True
    )
    token: Mapped[str] = mapped_column(
        String(500),
        nullable= False,
        unique=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable= False
    )
    expires_at: Mapped[int] = mapped_column(
        DateTime(timezone=True)
    )
    created_at: Mapped[int] = mapped_column(
        DateTime(timezone=True),
        server_default= func.now()
    )