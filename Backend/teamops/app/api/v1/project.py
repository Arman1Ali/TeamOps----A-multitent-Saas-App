"""Project endpoints.

This module belongs to the API layer (app/api/v1).

Five paths, one per action the Projects screen offers. Every one of them is
authenticated, and each hands its real work to a single function in
app/services/project.py - so the rule "who may do this" is written once, in one
place, and cannot drift between endpoints.

The old file exposed /project/post and /project/get, which said nothing about
what the call did, and used `route = APIRouter(...)` while every other module
used `router`. Both are corrected here.
"""

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser, DbDep
from app.schemas.auth import MessageResponse
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project import (
    create_project_service,
    delete_project_service,
    get_project_by_id_service,
    get_projects_service,
    update_project_service,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    db: DbDep,
    current_user: CurrentUser,
    page: int = 1,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
    company_id: int | None = None,
):
    """The workspace's projects, one page at a time.

    `company_id` is only meaningful for a platform admin; for anybody else the
    service substitutes the caller's own workspace and ignores what was typed
    into the URL.

    `search` matches against the project name, and `sort` accepts the column
    names listed in app/curd/project.py:ALLOWED_SORTS.
    """
    return get_projects_service(
        db=db,
        current_user=current_user,
        company_id=company_id,
        page=page,
        limit=limit,
        sort=sort,
        search=search,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    db: DbDep,
    current_user: CurrentUser,
):
    """File a new project in the caller's workspace.

    201 because this is the endpoint that creates something.

    Any member of a workspace may start a project - spotting the work is half
    of doing it. Changing or removing one afterwards is restricted to the owner
    and admins, see PUT and DELETE below.

    The workspace is taken from the caller's token, never from the body.
    """
    return create_project_service(
        db=db, project=project, current_user=current_user
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """One project by id.

    Any member of the same workspace may read it. 404 when the id does not
    exist, 403 when it exists but belongs to somebody else's workspace.
    """
    return get_project_by_id_service(
        db=db, project_id=project_id, current_user=current_user
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Change a project - its name, description, status, progress or deadline.

    Fields left out of the body are left alone, which is why the frontend can
    send just {"progress": 45} when a slider moves.
    """
    return update_project_service(
        db=db, project_id=project_id, update=project, current_user=current_user
    )


@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(
    project_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """Remove a project, and every task inside it.

    Owner or admin only. The tasks go with it - see the cascade note in
    app/models/project.py - so the message says which project was erased,
    which is the only clue the caller gets afterwards.
    """
    return {
        "message": delete_project_service(
            db=db, project_id=project_id, current_user=current_user
        )
    }
