from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.curd.Project import get_project_by_id
from app.curd.task import (
    create_task,
    delete_task,
    get_task_by_id,
    get_tasks,
    update_task,
)

from app.services.common import require_owner, same_company
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


def create_task_service(
    task: TaskCreate,
    db: Session,
    current_user: User ,
):
    project = get_project_by_id(db, task.project_id)

    require_owner(current_user)
    same_company(current_user, project.company_id )
    

    data = task.model_dump()

   
    return create_task(db=db, task=data)


def get_tasks_service(
    db: Session,
    project_id: int,
    current_user: User,
):
    project = get_project_by_id( db, project_id)

    same_company(current_user, project.company_id)

    return get_tasks(db=db, project_id=project_id)


def get_task_by_id_service(
    task_id: int,
    db: Session,
    current_user: User ,
):
    task = get_task_by_id(db= db, task_id= task_id)
    project = get_project_by_id( db= db, project_id= task.project_id)

    same_company(current_user, project.company_id )

    return get_task_by_id( db=db,  task_id= task_id )


def update_task_service(
    task_id: int,
    task_update: TaskUpdate,
    db: Session,
    current_user: User,
):
    task = get_task_by_id(db=db, task_id=task_id)

    project = get_project_by_id( db= db, project_id= task.project_id )

    require_owner(current_user)
    same_company(current_user, project.company_id)

    update_data = task_update.model_dump(exclude_unset=True)

    return update_task(db=db, task_id=task_id, update=update_data)


def delete_task_service(
    task_id: int,
    db: Session,
    current_user: User ,
):
    task = get_task_by_id(db=db, task_id=task_id)
    project = get_project_by_id( db= db, project_id= task.project_id)

    require_owner( current_user )
    same_company( current_user, project.company_id )

    return delete_task(db=db, task_id=task_id)
