from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.curd.user import (
    create_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user,
)
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.common import can_admin_or_owner


def create_user_service(
    user_data: UserCreate,
    db: Session,
    current_user: User,
):

    can_admin_or_owner(current_user, UserCreate.company_id)

    data = user_data.model_dump()

    data["password"] = hash_password(data["password"])

    return create_user(db=db, user_data=data)


def get_users_service(
    company_id: int,
    db: Session,
    current_user: User,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    short: str = "id",
):

    can_admin_or_owner(current_user, company_id)
    offset = (page - 1) * limit

    return get_users(db=db, offset=offset, limit=limit, search=search, short=short)


def get_user_by_id_service(
    user_id: int,
    db: Session,
    current_user: User,
):
    user = get_user_by_id(db=db, user_id=user_id)
    can_admin_or_owner(current_user, user.company_id)

    user = get_user_by_id(db=db, user_id=user_id)

    return user


def update_user_service(
    user_id: int,
    update: UserUpdate,
    db: Session,
    current_user: User,
):

    user = get_user_by_id(db=db, user_id=user_id)
    can_admin_or_owner(current_user, user.company_id)

    update_data = update.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])

    return update_user(db=db, user_id=user_id, update=update_data)


def delete_user_service(
    company_id: int,
    user_id: int,
    db: Session,
    current_user: User = Depends(get_current_user),
):
    can_admin_or_owner(current_user, company_id)

    return delete_user(db=db, user_id=user_id)
