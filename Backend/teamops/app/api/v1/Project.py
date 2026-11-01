from fastapi import APIRouter, Depends

from app.db.session import Session, get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.Project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.Project import (
    create_project_service,
    delete_project_service,
    get_project_service,
    update_project_service,
)
from app.services.Project import (
    get_project_by_id_service as get_project_by_id_service_impl,
)

route = APIRouter(prefix="/projects", tags=["Project"])


@route.post("/post", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return create_project_service(project=project, db=db, current_user=current_user)


@route.get("/get", response_model=list[ProjectResponse])
def get_projects(
    company_id: int,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
    short: str = "id ",
    search: str | None = None,
    db: Session = Depends(get_db),
):

    return get_project_service(
        db=db,
        page=page,
        limit=limit,
        short=short,
        search=search,
        current_user=current_user,
        company_id=company_id,
    )


@route.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_project_by_id_service_impl(
        db=db, project_id=project_id, current_user=current_user
    )


@route.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    update: ProjectUpdate,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_project_service(
        db=db, project_id=project_id, update=update, current_user=current_user
    )


@route.delete("/{project_id}")
def delete_poroject(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_project_service(
        project_id=project_id, db=db, current_user=current_user
    )
