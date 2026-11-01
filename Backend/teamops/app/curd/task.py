from app.db.session import Session
from app.models.task import Task


def create_task(task: dict, db: Session):
    task_modle = Task(**task)

    db.add(task_modle)
    db.commit()
    db.refresh(task_modle)
    return task_modle


def get_task(
    db: Session, offset: int, limit: int, short: str = "id ", search: str | None = None
):
    quary = db.query(Task)
    if search:
        quary = quary.filter(Task.title.ilike(f"%{search}%"))
    if short:
        short_filds = {"name": Task.title, "project_id": Task.project_id}
        quary = quary.order_by(short_filds.get(short, Task.id))

    quary = quary.offset(offset).limit(limit).all()

    return quary


def get_tasks(db: Session, project_id: int):
    return db.query(Task).filter(Task.project_id == project_id).all()


def get_task_by_id(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()


def update_task(db: Session, task_id: int, update: dict):
    quary = db.query(Task).filter(Task.id == task_id).first()

    for key, value in update.items():
        setattr(quary, key, value)

    db.commit()
    db.refresh(quary)
    return quary


def delete_task(task_id: int, db: Session):
    task = db.query(Task).filter(Task.id == task_id).first()

    db.delete(task)
    db.commit()
    return f"You Removed {task.title} Succesfully"
