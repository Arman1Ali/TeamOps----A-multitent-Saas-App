"""Task request and response shapes.

This module belongs to the SCHEMA layer (app/schemas).

`assigned_to` changed from a person's name typed into a text box into a user id,
so the create/update schemas take an integer and the response carries the whole
assignee - name and initials included - rather than making the frontend look it
up from a list it may not have loaded yet.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ProjectBrief, UserBrief

# The three columns of the Tasks board, and the words the filter chips use.
TaskStatus = Literal["To do", "In progress", "Done"]

# Shown as the coloured badge on every task row.
TaskPriority = Literal["High", "Medium", "Low"]


class TaskCreate(BaseModel):
    """Body of POST /tasks."""

    title: str = Field(min_length=1, max_length=100)

    description: str = Field(default="", max_length=1000)

    status: TaskStatus = "To do"

    priority: TaskPriority = "Medium"

    # Required: a task always lives inside a project. The service checks that
    # the project exists and belongs to the caller.
    project_id: int

    # Optional, and validated against the caller's own workspace.
    assigned_to: int | None = None

    due_date: date | None = None


class TaskUpdate(BaseModel):
    """Body of PUT /tasks/{id}.

    Everything is optional because this endpoint serves several different
    actions in the UI: ticking a task off sends {"status": "Done"}, re-assigning
    sends {"assigned_to": 4}, and nothing else has to be repeated.
    """

    title: str | None = Field(default=None, min_length=1, max_length=100)

    description: str | None = Field(default=None, max_length=1000)

    status: TaskStatus | None = None

    priority: TaskPriority | None = None

    project_id: int | None = None

    # Leaving this out means "keep whoever has it". Sending it as null means
    # "give it back to the unassigned pile". Both work because the service
    # dumps only the fields the client actually sent (exclude_unset=True).
    assigned_to: int | None = None

    due_date: date | None = None


class TaskResponse(BaseModel):
    """What every task endpoint returns.

    The nested project and assignee come along because the task row shows both:
    the project name under the title, and the avatar on the right. They arrive
    through the joined loads in app/curd/task.py, so this costs no extra
    queries.
    """

    id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    project_id: int
    assigned_to: int | None
    due_date: date | None
    created_at: datetime
    updated_at: datetime

    project: ProjectBrief

    # Null when the task is still up for grabs.
    assignee: UserBrief | None = None

    model_config = ConfigDict(from_attributes=True)
