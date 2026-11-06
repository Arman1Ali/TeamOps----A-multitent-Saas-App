"""Project request and response shapes.

This module belongs to the SCHEMA layer (app/schemas).

Three models for three jobs:

* ProjectCreate  - what POST accepts
* ProjectUpdate  - what PUT accepts, every field optional
* ProjectResponse- what the API sends back

`status` and `progress` are checked here rather than in the database, because
these are the values the frontend's cards and filters rely on.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# The words the Projects screen filters on. A Literal means Pydantic rejects
# anything else before it reaches the database, and Swagger shows the choices.
ProjectStatus = Literal["On track", "At risk", "Blocked", "Done"]


class ProjectCreate(BaseModel):
    """Body of POST /projects."""

    name: str = Field(min_length=1, max_length=100)

    description: str = Field(default="", max_length=500)

    # A new project starts quietly: nothing done yet, nothing going wrong yet.
    status: ProjectStatus = "On track"

    progress: int = Field(default=0, ge=0, le=100)

    due_date: date | None = None

    # company_id is deliberately NOT a field here. The project always lands in
    # the caller's own workspace, decided in app/services/project.py. Accepting
    # it from the body would let anyone file data into somebody else's company.
    # The old schema took it, and the service ignored it after checking it -
    # which is how the chicken-and-egg 400 in the API docs came about.


class ProjectUpdate(BaseModel):
    """Body of PUT /projects/{id}.

    Every field is optional, so a caller may send just {"progress": 40} and
    leave the rest alone. That is what the frontend needs when a slider moves.
    """

    name: str | None = Field(default=None, min_length=1, max_length=100)

    description: str | None = Field(default=None, max_length=500)

    status: ProjectStatus | None = None

    progress: int | None = Field(default=None, ge=0, le=100)

    # Sending null explicitly means "clear the deadline", which is different
    # from leaving the field out.
    due_date: date | None = None


class ProjectResponse(BaseModel):
    """What every project endpoint returns."""

    id: int
    name: str
    description: str
    status: ProjectStatus
    progress: int
    due_date: date | None

    # Returned so the frontend can tell which workspace it is looking at, but
    # never accepted on the way in.
    company_id: int

    created_at: datetime
    updated_at: datetime

    # The tasks are NOT part of this shape. A project list would otherwise drag
    # every task of every project along with it. The Tasks endpoints provide
    # them instead.
    model_config = ConfigDict(from_attributes=True)
