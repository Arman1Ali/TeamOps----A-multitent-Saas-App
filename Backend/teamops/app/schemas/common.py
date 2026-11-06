"""Small shapes reused by several resources.

This module belongs to the SCHEMA layer (app/schemas).

Schemas are Pydantic models: they check what the client sent, and they decide
exactly what the API is allowed to send back. Nothing here touches the
database.

Two things in this file are shared on purpose:

* EmailString, so an email address is normalised the same way everywhere;
* the "Brief" response models, because a task must name its project, a project
  must name its owner, and repeating those fields by hand is how the two
  versions drift apart. The frontend reads nested objects of these shapes, so
  keeping them separate is not a luxury.
"""

from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict


def normalise_email(value: str) -> str:
    """Trim the address and lowercase it, or reject it.

    Lowercasing is what makes LoginEmail@Example.com and loginemail@example.com
    the same account. The database column is unique, so without this a second
    spelling of the same address would silently create a duplicate login.
    """
    cleaned = value.strip().lower()

    # A basic shape check. A full RFC 5322 validator would only add noise here:
    # what matters is that a real message can reach the address.
    if cleaned.count("@") != 1 or cleaned.startswith("@") or cleaned.endswith("@"):
        raise ValueError("a valid email address is required")

    return cleaned


# Any schema that takes an email uses this, so the rule lives in exactly one
# place.
EmailString = Annotated[str, AfterValidator(normalise_email)]


class UserBrief(BaseModel):
    """The part of a person that other resources are allowed to show.

    Nested inside a task or a company, which is why it must never carry a
    password - not even a hashed one.
    """

    id: int
    name: str
    email: str
    role: str

    # The avatar only needs one or two letters, derived from the name.
    initials: str

    # Lets Pydantic build this from the ORM object instead of a dictionary.
    model_config = ConfigDict(from_attributes=True)


class ProjectBrief(BaseModel):
    """How a task refers to the project it belongs to."""

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CompanyBrief(BaseModel):
    """How a user refers to the workspace they belong to."""

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CompanyDetail(BaseModel):
    """A workspace with its teammates and projects.

    Shown on the Team screen, and by GET /companies/{id}.
    """

    id: int
    name: str
    users: list[UserBrief] = []
    projects: list[ProjectBrief] = []

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    """Answer of the /health and /health/db endpoints."""

    status: str
    database: str | None = None
