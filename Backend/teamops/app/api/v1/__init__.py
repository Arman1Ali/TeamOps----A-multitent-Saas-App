"""Gathering every version 1 router into one.

This module belongs to the API layer (app/api/v1).

app/main.py includes this single router instead of five separate ones, so there
is exactly one place to look to know what the versioned API exposes, and
adding a resource means adding one line below.

Each module keeps its own prefix (/projects, /tasks, ...), so nothing here has
to repeat paths that are already written.
"""

from fastapi import APIRouter

from app.api.v1 import auth, company, project, task, user

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(company.router)
api_router.include_router(project.router)
api_router.include_router(task.router)
api_router.include_router(user.router)
