"""Business rules for projects.

This module belongs to the SERVICE layer (app/services).

The layer between the endpoints and the database. It is the only place that
decides three things about a project:

* who may see or change it        -> the helpers in app/services/common.py
* which workspace it ends up in   -> always the caller's, never the caller's input
* what a missing row means        -> 404, through require_found()

Code in app/api/v1/project.py should stay thin, and no SQL belongs in here -
that is app/curd/project.py's job.
"""

from sqlalchemy.orm import Session

from app.curd.project import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects,
    update_project,
)
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.common import (
    can_admin_or_owner,
    can_view_company,
    is_admin,
    require_found,
    same_company,
    to_offset,
)


def resolve_company_id(current_user: User, requested_company_id: int | None) -> int:
    """Work out which workspace a request is about.

    Normally that is the caller's own company, taken from the token - never from
    a query string, because a query string is something the client controls.

    An admin may point a list at a specific company id, and the id is checked
    before it is trusted rather than used as an excuse to skip the check.
    """
    if requested_company_id is None:
        return current_user.company_id

    # Only platform staff may ask for somebody else's workspace by id. For
    # everybody else this raises, which is the answer.
    if not is_admin(current_user):
        same_company(current_user, requested_company_id)

    return requested_company_id


def create_project_service(
    db: Session, project: ProjectCreate, current_user: User
) -> Project:
    """File a new project inside the caller's own workspace.

    `company_id` from the request body is dropped on purpose: it is the one
    field that decides who owns the data, so the server sets it itself.
    """
    data = project.model_dump(exclude={"company_id"})

    data["company_id"] = current_user.company_id

    return create_project(db=db, project=data)


def get_projects_service(
    db: Session,
    current_user: User,
    company_id: int | None = None,
    page: int = 1,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
) -> list[Project]:
    """List one workspace's projects.

    The previous version of this function looked `company_id` up as if it were a
    project id, then read `.company_id` off whatever came back - so a wrong id
    crashed with a 500. Worse, the query that did run was never filtered by
    workspace, which leaked every tenant's projects to anyone holding a token.
    """
    target_company_id = resolve_company_id(current_user, company_id)

    can_view_company(current_user, target_company_id)

    return get_projects(
        db=db,
        company_id=target_company_id,
        offset=to_offset(page, limit),
        limit=limit,
        sort=sort,
        search=search,
    )


def get_project_by_id_service(
    db: Session, project_id: int, current_user: User
) -> Project:
    """One project, but only if it lives in the caller's workspace.

    Reading a single project is open to every member of that workspace, not just
    its owner - the Projects and Overview screens both need it.
    """
    project = require_found(get_project_by_id(db=db, project_id=project_id), "Project")

    can_view_company(current_user, project.company_id)

    return project


def update_project_service(
    db: Session, project_id: int, update: ProjectUpdate, current_user: User
) -> Project:
    """Change a project. Owner of the workspace, or platform admin, only.

    `exclude_unset` is what makes this a patch: leaving `progress` out of the
    JSON genuinely means "do not touch it", as opposed to "set it to nothing".
    """
    project = require_found(get_project_by_id(db=db, project_id=project_id), "Project")

    can_admin_or_owner(current_user, project.company_id)

    update_data = update.model_dump(exclude_unset=True)

    # Ownership of a project is not something a normal update can move. If a
    # cross-workspace move is ever wanted, it needs its own endpoint with its
    # own rules, because both workspaces would have to agree to it.
    update_data.pop("company_id", None)

    updated = update_project(db=db, project_id=project_id, update=update_data)

    return require_found(updated, "Project")


def delete_project_service(db: Session, project_id: int, current_user: User) -> str:
    """Remove a project, and with it its tasks.

    Deliberately owner-or-admin only: a member who cannot see the whole
    workspace picture should not be able to erase a project and the work inside
    it in one click.
    """
    project = require_found(get_project_by_id(db=db, project_id=project_id), "Project")

    can_admin_or_owner(current_user, project.company_id)

    deleted = delete_project(db=db, project_id=project_id)

    require_found(deleted, "Project")

    return f"Removed project '{deleted.name}'"
