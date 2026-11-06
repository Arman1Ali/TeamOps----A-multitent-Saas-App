"""User request and response shapes.

This module belongs to the SCHEMA layer (app/schemas).

The rule this file exists to enforce: a password goes in, and never comes out.
UserResponse has no password field at all, so even a careless endpoint cannot
leak one.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import CompanyBrief, EmailString

# The three roles, matching app/models/user.py and the checks in
# app/services/common.py.
UserRole = Literal["owner", "admin", "member"]


class UserCreate(BaseModel):
    """Body of POST /users - inviting a teammate.

    `company_id` is not here on purpose. The newcomer joins the inviter's own
    workspace, decided in app/services/user.py.
    """

    name: str = Field(min_length=1, max_length=50)

    email: EmailString

    # 8 is the shortest password worth allowing. It is write-only: nothing
    # reads this field back out.
    password: str = Field(min_length=8, max_length=128)

    role: UserRole = "member"


class UserUpdate(BaseModel):
    """Body of PUT /users/{id}.

    Every field is optional so the same endpoint covers renaming someone,
    moving them to another role, and changing their password.

    The class used to be named UserReplace with all fields required, which
    meant a profile edit had to re-send the password every time.
    """

    name: str | None = Field(default=None, min_length=1, max_length=50)

    email: EmailString | None = None

    password: str | None = Field(default=None, min_length=8, max_length=128)

    role: UserRole | None = None


class UserResponse(BaseModel):
    """What the API sends back about a person.

    `initials` is read from the property on the model, so an avatar can be drawn
    without the frontend working out whose name has two parts.

    `company` is nested because the frontend needs to know which workspace the
    signed-in user belongs to before it can show anything else.
    """

    id: int
    name: str
    email: str
    role: UserRole
    company_id: int
    initials: str
    company: CompanyBrief | None = None
    created_at: datetime

    # from_attributes lets Pydantic read this straight off the User model,
    # including the `initials` property and the `company` relationship that
    # app/curd/user.py loads with a join.
    model_config = ConfigDict(from_attributes=True)
