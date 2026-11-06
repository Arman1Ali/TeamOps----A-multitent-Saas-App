"""Imports every model so Alembic and SQLAlchemy know about all of them.

This module belongs to the DATA LAYER (app/db).

Base.metadata is what Alembic reads to work out what the database should look
like. A model that is not imported here is invisible to it, and Alembic would
then try to DROP the table it cannot see. Every model must be listed below.
"""

from app.db.base_class import Base
from app.models.company import Company
from app.models.project import Project
from app.models.refresh_token import RefreshToken
from app.models.task import Task
from app.models.user import User

# Nothing in this module reads the names above, and a linter would otherwise
# delete them as unused imports and quietly break Alembic: naming them here
# says that being imported *is* the point, and the side effect of importing
# each model is that it registers its table on Base.metadata.
__all__ = ["Base", "Company", "Project", "RefreshToken", "Task", "User"]
