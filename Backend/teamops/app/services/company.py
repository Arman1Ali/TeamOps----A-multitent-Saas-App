from sqlalchemy.orm import Session

from app.curd.company import (
    create_company,
    delete_company,
    get_company,
    get_company_by_id,
    update_company,
)
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.services.common import (
    can_admin_or_owner,
    require_admin,
)


def create_company_service(
    db: Session, company_data: CompanyCreate, current_user: User
):

    require_admin(current_user)

    return create_company(
        db=db, company_crt_schma=company_data.model_dump(exclude_unset=True)
    )



def get_company_service(
    db: Session,
    current_user: User,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    short: str = "id",
):
    require_admin(current_user)

    offset = (page - 1) * limit

    return get_company(db=db, limit=limit, offset=offset, search=search)


def get_company_by_id_service(db: Session, current_user: User, Company_id: int):
    require_admin(current_user)

    return get_company_by_id(db=db, Company_id=Company_id)


def update_company_service(
    db: Session,
    Company_id: int,
    new_Name: CompanyUpdate,
    current_user: User,
):

    can_admin_or_owner(current_user, Company_id)

    return update_company(db=db, Company_id=Company_id, new_Name=new_Name)


def delete_company_service(
    db: Session,
    company_id: int,
    current_user: User,
):

    can_admin_or_owner(current_user, company_id)

    return delete_company(db=db, company_id=company_id)
