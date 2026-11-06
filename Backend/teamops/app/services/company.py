"""Business rules for workspaces.

This module belongs to the SERVICE layer (app/services).

A Company is what the frontend calls a workspace, and it is the tenant boundary
everything else is measured against.

There is deliberately no "create a workspace" function that takes a caller.
Signing up is an unauthenticated act - you cannot already be signed in to a
workspace you do not have yet - so it lives in app/services/auth.py as
register_service(). What is here is the shared, authenticated half: reading,
renaming and removing workspaces that already exist.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.curd.company import (
    create_company,
    delete_company,
    get_companies,
    get_company_by_id,
    update_company,
)
from app.curd.user import create_user, get_user_by_email
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyUpdate
from app.services.common import (
    ROLE_OWNER,
    can_admin_or_owner,
    can_view_company,
    is_admin,
    require_found,
)


def create_company_with_owner(
    db: Session, company_name: str, owner_name: str, owner_email: str, owner_password: str
) -> Company:
    """Start a workspace and the owner who runs it, as one unit of work.

    This is the shape the old API was missing. Its POST /companies wanted a
    signed-in user, but a signed-in user only exists once a company does - so
    the very first request could never succeed.

    Both rows are written here rather than in two endpoints so that a failure
    part way through cannot leave an empty workspace behind. The caller commits;
    see app/services/auth.py.

    The email uniqueness rule is checked before inserting, so a duplicate
    signup gets a clear 409 instead of a database error.
    """
    if get_user_by_email(db=db, email=owner_email) is not None:
        raise HTTPException(
            status_code=409,
            detail="That email address already belongs to an account",
        )

    company = create_company(db=db, name=company_name)

    create_user(
        db=db,
        user={
            "name": owner_name,
            "email": owner_email,
            "password": hash_password(owner_password),
            "role": ROLE_OWNER,
            "company_id": company.id,
        },
    )

    # The owner is part of the answer the client gets back, so reload the
    # workspace with its roster attached instead of leaving it lazy.
    return get_company_by_id(db=db, company_id=company.id) or company


def get_companies_service(db: Session, current_user: User) -> list[Company]:
    """The workspaces this caller is allowed to know about.

    An admin sees every workspace, because that is what an admin is for.
    Everybody else sees the one they belong to. The list of ids is worked out
    here and handed to the query layer, which is the only place that knows how
    to filter - so the rule cannot be forgotten in the SQL.
    """
    if is_admin(current_user):
        return get_companies(db=db)

    return get_companies(db=db, company_ids=[current_user.company_id])


def get_company_by_id_service(
    db: Session, company_id: int, current_user: User
) -> Company:
    """One workspace with its teammates and projects.

    Members may read their own workspace's details - the Team screen is built
    from exactly this - but naming someone else's id is refused.
    """
    company = require_found(
        get_company_by_id(db=db, company_id=company_id), "Company"
    )

    can_view_company(current_user, company.id)

    return company


def update_company_service(
    db: Session, company_id: int, update: CompanyUpdate, current_user: User
) -> Company:
    """Rename a workspace. Owner of it, or an admin.

    The name is unique in the database, so a clash comes back as a 409 from the
    error handler in app/main.py rather than as an unexplained 500.
    """
    company = require_found(
        get_company_by_id(db=db, company_id=company_id), "Company"
    )

    can_admin_or_owner(current_user, company.id)

    # model_dump with exclude_unset means an empty body changes nothing.
    name = update.model_dump(exclude_unset=True).get("name")

    if name is None:
        return company

    renamed = update_company(db=db, company_id=company_id, name=name)

    return require_found(renamed, "Company")


def delete_company_service(db: Session, company_id: int, current_user: User) -> str:
    """Erase a workspace and everything inside it.

    Restricted to an admin, or to the owner of that workspace - and even then
    only when they are not deleting the very workspace they are signed in to.
    That last rule is not politeness: removing your own workspace leaves the
    token you are calling with pointing at a company that no longer exists, and
    every screen you have open showing stale data.

    The order the rows go in, and why it matters, is written out in
    app/curd/company.py.
    """
    company = require_found(
        get_company_by_id(db=db, company_id=company_id), "Company"
    )

    can_admin_or_owner(current_user, company.id)

    if current_user.company_id == company.id and not is_admin(current_user):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot delete the workspace you are signed in to. "
                "Ask an admin, or sign in from another workspace first"
            ),
        )

    deleted = delete_company(db=db, company_id=company_id)

    # require_found here would be the wrong tool: delete_company answers None
    # only when there was nothing to remove, and the lookup above has already
    # proved there was. Naming the workspace that went is the useful half of
    # the answer.
    if deleted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )

    return f"Removed workspace '{deleted}' and everything inside it"
