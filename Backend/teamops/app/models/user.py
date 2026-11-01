from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    password: Mapped[str] = mapped_column(String(255), nullable=False)

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    role: Mapped[str] = mapped_column(String(100), default="member", nullable=False)

    company: Mapped[Company] = relationship(back_populates="users")
