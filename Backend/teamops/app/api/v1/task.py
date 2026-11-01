from fastapi import APIRouter, Depends

from app.db.session import Session, get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task import (
    create_task_service,
    delete_task_service,
    get_tasks_service,
    update_task_service,
)

route = APIRouter(prefix="/tasks", tags=["Task"])


@route.post("/post", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return create_task_service(task=task, db=db, current_user=current_user)


@route.get("/get", response_model=list[TaskResponse])
def get_task(
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
    short: str = "id ",
    search: str | None = None,
    db: Session = Depends(get_db),
):

    return get_tasks_service(
        db=db,
        page=page,
        limit=limit,
        short=short,
        search=search,
        current_user=current_user,
    )


@route.put("/{task_id}", response_model=TaskResponse)
def update_task(
    update: TaskUpdate,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_task_service(
        db=db, task_id=task_id, update=update, current_user=current_user
    )


@route.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_task_service(task_id=task_id, db=db, current_user=current_user)
