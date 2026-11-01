from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate
from app.services.company import (
    create_company_service,
    delete_company_service,
    get_company_by_id_service,
    get_company_service,
    update_company_service,
)

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("", response_model=CompanyResponse)
def create_company(
    company: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_company_service(
        db=db, company_data=company, current_user=current_user
    )


@router.get("", response_model=list[CompanyResponse])
def get_company(
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    short: str = "id",
    db: Session = Depends(get_db),
):
    return get_company_service(
        db=db, current_user=current_user, page=page, limit=limit, search=search
    )


@router.get("/{Company_id}", response_model=CompanyResponse)
def get_company_by_id(
    Company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_company_by_id_service(
        db=db, company_id=Company_id, current_user=current_user
    )


@router.put("/{Company_id}", response_model=CompanyResponse)
def update_company(
    new_Name: CompanyUpdate,
    Company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_company_service(
        db=db, new_Name=new_Name, Company_id=Company_id, current_user=current_user
    )


@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_company_service(
        db=db, company_id=company_id, current_user=current_user
    )
