"""Database queries for tasks.

This module belongs to the CRUD layer (app/curd).

Queries only - permission decisions live in app/services/task.py.

The important difference from the previous version of this file: tasks do not
have a company_id column of their own, so scoping them to one workspace means
going through their project. That join is what stops one company reading
another company's tasks.
"""

from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.models.task import Task

# What the API accepts in ?sort=.
ALLOWED_SORTS = {
    "created_at": "created_at",
    "title": "title",
    "status": "status",
    "priority": "priority",
    "due_date": "due_date",
}


def create_task(db: Session, task: dict) -> Task:
    """Insert one task row.

    `assigned_to` may be absent or None, which is how an unassigned task is
    created - the column is nullable on purpose.
    """
    db_task = Task(**task)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def get_tasks(
    db: Session,
    company_id: int,
    project_id: int | None = None,
    assigned_to: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
) -> list[Task]:
    """One page of the tasks belonging to one workspace.

    Three things happen here that are worth knowing about:

    * the join to Project is what makes company scoping possible at all;
    * joinedload pulls the project and the assignee in the same SQL statement,
      instead of one extra query per task the frontend displays;
    * every filter is optional, so this one function serves the full board, a
      single column, and "my tasks".
    """
    query = (
        db.query(Task)
        .join(Project, Task.project_id == Project.id)
        .filter(Project.company_id == company_id)
        .options(joinedload(Task.project), joinedload(Task.assignee))
    )

    if project_id is not None:
        query = query.filter(Task.project_id == project_id)

    if assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)

    if status is not None:
        query = query.filter(Task.status == status)

    if search:
        # A task is found by what it says, so both text columns are checked.
        query = query.filter(
            Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%")
        )

    order = getattr(Task, ALLOWED_SORTS.get(sort, "created_at"))

    if sort == "created_at":
        query = query.order_by(order.desc())
    else:
        query = query.order_by(order.asc())

    return query.offset(offset).limit(limit).all()


def get_task_by_id(db: Session, task_id: int) -> Task | None:
    """One task by id, with its project and assignee already loaded.

    The two joinedload calls matter: the permission check that follows reads
    `task.project.company_id`, and without the join that line would go off to
    the database on its own.
    """
    return (
        db.query(Task)
        .options(joinedload(Task.project), joinedload(Task.assignee))
        .filter(Task.id == task_id)
        .one_or_none()
    )


def update_task(db: Session, task_id: int, update: dict) -> Task | None:
    """Change the columns the caller sent, then hand back the saved row.

    Returns None when there is no such task, so the service can answer 404.
    """
    task = db.get(Task, task_id)

    if task is None:
        return None

    for field, value in update.items():
        setattr(task, field, value)

    db.commit()

    # Re-read so the response carries the freshly loaded project and assignee.
    return get_task_by_id(db=db, task_id=task_id)


def delete_task(db: Session, task_id: int) -> Task | None:
    """Remove one task, and return it so the caller can name it.

    Tasks are leaf rows - nothing points at them - so this needs no cascade.
    """
    task = db.get(Task, task_id)

    if task is None:
        return None

    db.delete(task)
    db.commit()

    return task
