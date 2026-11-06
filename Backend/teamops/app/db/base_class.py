"""The declarative base class every model inherits from.

This module belongs to the DATA LAYER (app/db).

Inheriting from Base is what turns a plain Python class into a table: SQLAlchemy
collects the columns declared in the class, and Alembic compares that collection
against the real database to decide what a migration must change.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared parent for Company, User, Project, Task and RefreshToken."""

