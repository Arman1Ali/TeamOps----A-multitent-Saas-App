"""Company (workspace) request and response shapes.

This module belongs to the SCHEMA layer (app/schemas).

Creating a workspace is a two-step business, not a database insert: the company
row and its first owner have to appear together, because a workspace nobody
owns is unusable. That is why the create schema carries the owner's details,
and why app/services/company.py does both in one transaction.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import EmailString


class CompanyCreate(BaseModel):
    """Body of POST /companies - signing up a brand new workspace.

    There is no authentication for this call, so it has to bring everything:
    the workspace name, and the person who will own it.
    """

    name: str = Field(min_length=1, max_length=100)

    owner_name: str = Field(min_length=1, max_length=50)

    owner_email: EmailString

    owner_password: str = Field(min_length=8, max_length=128)


class CompanyUpdate(BaseModel):
    """Body of PUT /companies/{id} - renaming a workspace."""

    name: str | None = Field(default=None, min_length=1, max_length=100)


class CompanyResponse(BaseModel):
    """What the endpoints return for a workspace on its own."""

    id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
