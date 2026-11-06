"""Business rules for tasks.

This module belongs to the SERVICE layer (app/services).

A task is the one resource whose permission rule is narrower than the rest: it
may be changed by the workspace owner, by an admin, or by the teammate it is
assigned to. That last case is what the tick box on the Tasks screen does most
of the time, so it matters.

Every check goes through the project the task sits in, because tasks do not
store a company id of their own.
"""

from sqlalchemy.orm import Session

from app.curd.project import get_project_by_id
from app.curd.task import (
    create_task,
    delete_task,
    get_task_by_id,
    get_tasks,
    update_task,
)
from app.curd.user import get_user_by_id
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.common import (
    can_manage_task,
    can_view_company,
    require_found,
    same_company,
    to_offset,
)


def _check_project(db: Session, current_user: User, project_id: int) -> Project:
    """The project a task is about to be filed under, after checking it is
    usable: it exists, and it belongs to the caller's workspace.

    Without the second half, a user could hand their work to another tenant by
    guessing a project id from that company.
    """
    project = require_found(get_project_by_id(db=db, project_id=project_id), "Project")

    same_company(current_user, project.company_id)

    return project


def _check_assignee(db: Session, current_user: User, assigned_to: int | None) -> None:
    """A task may only be handed to somebody in your own workspace."""
    if assigned_to is None:
        return

    assignee = require_found(get_user_by_id(db=db, user_id=assigned_to), "User")

    same_company(current_user, assignee.company_id)


def create_task_service(db: Session, task: TaskCreate, current_user: User) -> Task:
    """Add a task to one of the caller's projects.

    Anyone in the workspace may create work - only filing it under a project
    from another company is refused.
    """
    _check_project(db=db, current_user=current_user, project_id=task.project_id)

    _check_assignee(db=db, current_user=current_user, assigned_to=task.assigned_to)

    return create_task(db=db, task=task.model_dump())


def get_tasks_service(
    db: Session,
    current_user: User,
    project_id: int | None = None,
    assigned_to: int | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
) -> list[Task]:
    """List the caller's workspace's tasks, optionally narrowed down.

    This replaces a version that was called with `page`, `limit` and `search`
    while its own signature asked for `project_id`, which raised a TypeError on
    every request. It is workspace-scoped now like everything else, and a task
    is visible to every member of that workspace.

    Passing `project_id` narrows to one project - which is what a project's own
    detail view needs - but never widens beyond the caller's workspace.
    """
    if project_id is not None:
        _check_project(db=db, current_user=current_user, project_id=project_id)

    if assigned_to is not None:
        assignee = require_found(get_user_by_id(db=db, user_id=assigned_to), "User")
        can_view_company(current_user, assignee.company_id)

    return get_tasks(
        db=db,
        company_id=current_user.company_id,
        project_id=project_id,
        assigned_to=assigned_to,
        status=status,
        offset=to_offset(page, limit),
        limit=limit,
        sort=sort,
        search=search,
    )


def get_task_by_id_service(db: Session, task_id: int, current_user: User) -> Task:
    """One task by id, refused if it lives in another workspace."""
    task = require_found(get_task_by_id(db=db, task_id=task_id), "Task")

    can_view_company(current_user, task.project.company_id)

    return task


def update_task_service(
    db: Session, task_id: int, task_update: TaskUpdate, current_user: User
) -> Task:
    """Change a task, or simply tick it off.

    The caller must be allowed to manage this task at all (owner, admin, or the
    assigned teammate), and if the update moves the task to a different project
    or a different person, both of those are checked too - otherwise the
    permission test would be a way to smuggle a task out of its workspace.
    """
    task = require_found(get_task_by_id(db=db, task_id=task_id), "Task")

    can_manage_task(current_user, task.assigned_to)

    update_data = task_update.model_dump(exclude_unset=True)

    if "project_id" in update_data:
        _check_project(
            db=db, current_user=current_user, project_id=update_data["project_id"]
        )

    if "assigned_to" in update_data:
        _check_assignee(
            db=db, current_user=current_user, assigned_to=update_data["assigned_to"]
        )

    updated = update_task(db=db, task_id=task_id, update=update_data)

    return require_found(updated, "Task")


def delete_task_service(db: Session, task_id: int, current_user: User) -> str:
    """Remove a task.

    Same rule as changing it: whoever is allowed to do the work is allowed to
    cancel it.
    """
    task = require_found(get_task_by_id(db=db, task_id=task_id), "Task")

    can_manage_task(current_user, task.assigned_to)

    deleted = delete_task(db=db, task_id=task_id)

    require_found(deleted, "Task")

    return f"Removed task '{deleted.title}'"
