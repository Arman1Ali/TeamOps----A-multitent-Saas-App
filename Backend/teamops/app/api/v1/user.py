from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserReplace, UserResponse
from app.services.user import (
    create_user_service,
    delete_user_service,
    get_user_by_id_service,
    get_users_service,
    update_user_service,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_user_service(db=db, user_data=user_data, current_user=current_user)


@router.get("", response_model=list[UserResponse])
def get_users(
    company_id: int,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    short: str = "id",
    db: Session = Depends(get_db),
):
    return get_users_service(
        page=page,
        limit=limit,
        db=db,
        search=search,
        short=short,
        current_user=current_user,
        company_id=company_id,
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_by_id_service(db=db, user_id=user_id, current_user=current_user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update: UserReplace,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user_service(
        update=update,
        db=db,
        user_id=user_id,
        current_user=current_user,
    )


@router.delete("/{user_id}")
def delete_user(
    company_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_user_service(
        db=db, user_id=user_id, current_user=current_user, company_id=company_id
    )
