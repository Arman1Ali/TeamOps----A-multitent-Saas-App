"""Task endpoints.

This module belongs to the API layer (app/api/v1).

The Tasks board and its tick box both live here. Tasks are the most frequently
written resource in the app, so this file is short on purpose: each action is
one call into app/services/task.py, where the "may this caller touch this task"
rule is written once.

Reads are workspace-scoped. Writes additionally allow the assigned teammate,
which is what makes the tick box work for an ordinary member - see
can_manage_task() in app/services/common.py.
"""

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser, DbDep
from app.schemas.auth import MessageResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task import (
    create_task_service,
    delete_task_service,
    get_task_by_id_service,
    get_tasks_service,
    update_task_service,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    db: DbDep,
    current_user: CurrentUser,
    project_id: int | None = None,
    assigned_to: int | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
):
    """The workspace's tasks, narrowed however the screen needs.

    Every filter is optional and they combine, which is why one endpoint serves
    all three views the frontend has:

      * the whole board              - no parameters;
      * one column                   - ?status=To%20do;
      * my tasks                     - ?assigned_to=<my id>;
      * one project's work           - ?project_id=<id>.

    No filter can widen the result beyond the caller's own workspace.
    `assigned_to` belonging to somebody in another company is refused.
    """
    return get_tasks_service(
        db=db,
        current_user=current_user,
        project_id=project_id,
        assigned_to=assigned_to,
        status=status,
        page=page,
        limit=limit,
        sort=sort,
        search=search,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Add a task to one of the caller's projects.

    404 when the project does not exist, 403 when it belongs to another
    workspace or when the person named in `assigned_to` is not a teammate.
    """
    return create_task_service(db=db, task=task, current_user=current_user)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """One task, with its project and assignee named.

    The nested objects come from the joined loads in app/curd/task.py, so this
    stays a single query rather than three.
    """
    return get_task_by_id_service(db=db, task_id=task_id, current_user=current_user)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Change a task, or tick it off.

    Sending {"status": "Done"} is all the tick box needs. Fields left out are
    left alone, so this one endpoint covers editing the title, changing
    priority, re-assigning, and moving a task to another project - and the last
    two are checked again before they are applied, because otherwise an
    otherwise-allowed update would be a way to push a task into somebody else's
    workspace.
    """
    return update_task_service(
        db=db, task_id=task_id, task_update=task, current_user=current_user
    )


@router.delete("/{task_id}", response_model=MessageResponse)
def delete_task(
    task_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """Remove a task for good.

    Allowed for exactly the people allowed to change it: an admin, the
    workspace owner, or the teammate holding the work. Cancelling a task you
    were given is a normal thing to do, so there is no reason for a stricter
    rule here than the one PUT uses.
    """
    return {
        "message": delete_task_service(
            db=db, task_id=task_id, current_user=current_user
        )
    }
