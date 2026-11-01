from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.curd.Project import (
    create_project,
    delete_poroject,
    get_project,
    get_project_by_id,
    update_project,
)
from app.models.user import User
from app.schemas.Project import ProjectCreate, ProjectUpdate
from app.services.common import can_admin_or_owner


def create_project_service(db: Session, project: ProjectCreate, current_user: User):

    can_admin_or_owner(current_user, project.company_id)

    data = project.model_dump()

    # Don't trust company_id from request
    data["company_id"] = current_user.company_id

    return create_project(db=db, project=data)


def get_project_service(
    company_id: int,
    current_user: User,
    db: Session,
    page: int = 1,
    limit: int = 10,
    short: str = "id",
    search: str | None = None,
):
    project = get_project_by_id(db, company_id)
    can_admin_or_owner(
        current_user, project.company_id
    )

    offset = (page - 1) * limit

    return get_project(
        db=db,
        offset=offset,
        short=short,
        search=search,
        limit=limit,
    )


def get_project_by_id_service(
    db: Session,
    project_id: int,
    current_user: User,
):
    project = get_project_by_id(db=db, project_id=project_id)

    can_admin_or_owner(current_user, project.company_id)

    return project


def update_project_service(
    db: Session,
    project_id: int,
    update: ProjectUpdate,
    current_user: User,
):

    project = get_project_by_id(db=db, project_id=project_id)

    can_admin_or_owner(current_user, project.company_id)

    update_data = update.model_dump(exclude_unset=True)

  
    update_data.pop("company_id", None)

    return update_project(db=db, project_id=project_id, update=update_data)


def delete_project_service(
    project_id: int,
    db: Session,
    current_user: User,
):
    project = get_project_by_id(db=db, project_id=project_id)

    can_admin_or_owner(current_user, project.company_id)

    return delete_poroject(db=db, project_id=project_id)
