"""The Task table.

This module belongs to the DATA MODEL layer (app/models).

A Task always belongs to one Project, and may be assigned to one User.

Note on `assigned_to`: it used to be free text ("Sung Arman"), which made it
impossible to look up who a task belongs to. It is now an integer foreign key to
users.id, and the frontend shows that user's initials. Migration
792e146c5e49 converted the existing rows.
"""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

# Named only for reading and type checking; SQLAlchemy resolves these by name.
# Importing them for real would circle back on themselves.
if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class Task(Base):
    # The table name stays `task` (singular) so the existing database and the
    # earlier migrations keep working. Renaming it would buy nothing.
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String(100), nullable=False)

    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    # "To do" | "In progress" | "Done". The frontend's tick box treats "Done" as
    # completed. Allowed values are enforced in app/schemas/task.py.
    # A Python-side default only: the existing database column has no default,
    # and rows already stored keep whatever they had.
    status: Mapped[str] = mapped_column(String(100), default="To do", nullable=False)

    # "High" | "Medium" | "Low", shown as a coloured badge. The width stays at
    # 100 to match the column migration 667f87eb87b7 already created.
    priority: Mapped[str] = mapped_column(
        String(100), default="Medium", nullable=False
    )

    # The project this task belongs to. Indexed because the task list is almost
    # always read one project at a time.
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"), nullable=False, index=True
    )

    # Who is doing the work. Nullable so a task can be created unassigned.
    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )

    # Optional deadline shown on the task row.
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # The project this task sits in, so a task read can name its project without
    # a second query. See the joined loads in app/curd/task.py.
    project: Mapped["Project"] = relationship(back_populates="tasks")

    # The assigned user, or None when nobody has picked the task up yet.
    assignee: Mapped["User | None"] = relationship(foreign_keys=[assigned_to])
