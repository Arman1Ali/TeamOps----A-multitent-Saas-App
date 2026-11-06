"""The Company table.

This module belongs to the DATA MODEL layer (app/models).

A Company is one tenant - what the frontend calls a "workspace". Every user and
every project hangs off one, which is what keeps one company's data away from
another's.

Note: an earlier draft of this file declared a `domain` column. The database has
never had one (no migration ever created it), so keeping it in the model would
have made every company query fail. The screen does not need it.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

# The classes named in the relationships below are only needed so that this
# file can be read and type-checked: SQLAlchemy looks them up by name in its own
# registry, not in here. Importing them for real would be a cycle - Company
# needs User, User needs Company - so the import is kept to type checking only.
if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)

    # The database enforces uniqueness here (constraint companies_name_key), so
    # the model says the same thing. It also means a duplicate name is rejected,
    # which app/api/v1/company.py turns into a clean 409.
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # This company's teammates, shown on the Team screen.
    users: Mapped[list["User"]] = relationship(back_populates="company")

    # This company's projects, shown on the Projects screen.
    projects: Mapped[list["Project"]] = relationship(back_populates="company")
