from fastapi import HTTPException, status

from app.models.user import User


def require_admin(current_user: User):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="admin access required"
        )


def require_owner(current_user: User):

    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required"
        )


def same_company(current_user: User, resource_company_id: int):

    if current_user.company_id != resource_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another company's resource",
        )


def can_admin_or_owner(current_user: User, company_id: int):

    if current_user.role == "admin":
        return

    if current_user.role == "owner" and current_user.company_id == company_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You cannot access another company's resource",
    )
