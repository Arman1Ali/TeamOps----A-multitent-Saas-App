"""Workspace (company) endpoints.

This module belongs to the API layer (app/api/v1).

One note about what is missing: there is no POST here. Starting a workspace is
an unauthenticated act - you cannot already be signed in to a workspace you do
not have yet - so it happens at POST /auth/register instead, which creates the
company and its owner together and returns a token pair. See
app/api/v1/auth.py.

What is here is the maintenance of a workspace that already exists.
"""

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbDep
from app.schemas.auth import MessageResponse
from app.schemas.common import CompanyDetail
from app.schemas.company import CompanyUpdate
from app.services.company import (
    delete_company_service,
    get_companies_service,
    get_company_by_id_service,
    update_company_service,
)

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=list[CompanyDetail])
def list_companies(
    db: DbDep,
    current_user: CurrentUser,
):
    """The workspaces this caller may see.

    For a member or an owner that means exactly one: their own. Only a
    platform admin gets a list with more than one entry in it, which is why no
    `page` or `company_id` parameter is needed - the answer is decided by who
    is asking, not by what they type.
    """
    return get_companies_service(db=db, current_user=current_user)


@router.get("/{company_id}", response_model=CompanyDetail)
def get_company(
    company_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """One workspace, with its teammates and its projects.

    The shape the Team screen is built from. Reading your own workspace is
    open to every member of it.
    """
    return get_company_by_id_service(
        db=db, company_id=company_id, current_user=current_user
    )


@router.put("/{company_id}", response_model=CompanyDetail)
def update_company(
    company_id: int,
    company: CompanyUpdate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Rename a workspace. Owner of it, or a platform admin.

    Names are unique in the database, so choosing one that is already taken
    comes back as a 409 rather than an unexplained server error.
    """
    return update_company_service(
        db=db, company_id=company_id, update=company, current_user=current_user
    )


@router.delete("/{company_id}", response_model=MessageResponse)
def delete_company(
    company_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """Erase a workspace and everything inside it: its people, projects, tasks
    and sessions.

    This is the most destructive call in the API, so the rules around it are
    the strictest. Owner or admin only, and an owner may not delete the
    workspace they are currently signed in to - that would leave the token
    making the call pointing at a company that has just stopped existing.
    """
    return {
        "message": delete_company_service(
            db=db, company_id=company_id, current_user=current_user
        )
    }
