from app.db.session import Session
from app.models.Project import Project


def create_project(project: dict, db: Session):
    project_modle = Project(**project)

    db.add(project_modle)
    db.commit()
    db.refresh(project_modle)
    return project_modle


def get_project(
    db: Session, offset: int, limit: int, short: str = "id ", search: str | None = None
):
    quary = db.query(Project)
    if search:
        quary = quary.filter(Project.name.ilike(f"%{search}%"))
    if short:
        short_filds = {"name": Project.name, "company_id": Project.company_id}
        quary = quary.order_by(short_filds.get(short, Project.id))

    quary = quary.offset(offset).limit(limit).all()

    return quary


def get_project_by_id(
    db: Session,
    project_id: int,
):
    quary = db.query(Project).filter(Project.id == project_id).first()

    return quary


def update_project(db: Session, project_id: int, update: dict):
    quary = db.query(Project).filter(Project.id == project_id).first()

    for key, value in update.items():
        setattr(quary, key, value)

    db.commit()
    db.refresh(quary)
    return quary


def delete_poroject(project_id: int, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()

    db.delete(project)
    db.commit()
    return f"You Removed {project.name} Succesfully"
