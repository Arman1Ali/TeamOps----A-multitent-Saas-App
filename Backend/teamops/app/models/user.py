"""The User table.

This module belongs to the DATA MODEL layer (app/models).

A User belongs to exactly one Company and carries a `role` that decides what
they may do:

    owner   - created the workspace, may change everything inside it
    admin   - platform staff, the only role allowed to cross company boundaries
    member  - ordinary teammate, sees their own company, finishes their own work

The password column stores an Argon2 hash, never the plain password.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

# Named only for reading and type checking; SQLAlchemy resolves the name in the
# relationship below through its own registry.
if TYPE_CHECKING:
    from app.models.company import Company


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    # Login identity. Unique across the whole table, so an email address is
    # enough to find a person without knowing their company.
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Which company this person belongs to. Indexed because nearly every query
    # and nearly every permission check filters by it.
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Newcomers default to the least powerful role.
    role: Mapped[str] = mapped_column(String(100), default="member", nullable=False)

    # The company this user works in. UserResponse reads it, so the frontend
    # learns which workspace to show from a single call.
    company: Mapped["Company"] = relationship(back_populates="users")

    @property
    def initials(self) -> str:
        """Up to two letters for the avatar, e.g. "Alex Morgan" -> "AM".

        A plain property rather than a column: it is only ever derived from the
        name, so storing it could let it disagree with the name. Pydantic reads
        it straight off this object thanks to from_attributes=True.
        """
        words = [word for word in self.name.split() if word.strip()]

        if not words:
            return "?"

        if len(words) == 1:
            return words[0][0].upper()

        return (words[0][0] + words[-1][0]).upper()
