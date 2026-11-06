"""The Project table.

This module belongs to the DATA MODEL layer (app/models).

A Project belongs to exactly one Company, and owns many Tasks. It carries the
fields the frontend shows on a project card: status, progress and due date.

Only this file describes how a project is stored. Validation of incoming values
lives in app/schemas/project.py, and the queries live in app/curd/project.py.
"""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

# Named only for reading and type checking; SQLAlchemy resolves these by name.
# Importing them for real would circle back on themselves.
if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.task import Task


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    description: Mapped[str] = mapped_column(String(500), nullable=False)

    # How the project is going. Stored as text so old rows never break; the
    # allowed values are enforced by the schema layer
    # (app/schemas/project.py) rather than by the database.
    # The database also defaults this, so a row inserted by hand or by raw SQL
    # still ends up in a sensible state.
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="On track", server_default="On track"
    )

    # Completion percentage shown by the progress bar, 0 to 100.
    progress: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    # Optional deadline. Nullable because a project can be created before its
    # due date is decided.
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # The company that owns this project. Multi-tenancy depends on this column:
    # every read is filtered by it so one company cannot see another's projects.
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Tasks that hang off this project. delete-orphan means removing a project
    # also removes its tasks, which stops the database refusing the delete
    # because of the task foreign key.
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )

    # The workspace this project belongs to. Used for the reverse read from
    # Company.projects, so a company detail response can list its projects.
    company: Mapped["Company"] = relationship(back_populates="projects")
