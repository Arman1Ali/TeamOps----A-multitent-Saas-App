"""The rules every service shares.

This module belongs to the SERVICE layer (app/services).

Everything in here answers one of two questions - "is this caller allowed to do
this?" and "this row does not exist, so what happens now?" - and raises an HTTP
error instead of returning True or False. That shape is deliberate: a boolean
invites the caller to forget to check it, whereas a raised exception cannot be
ignored on its way to the response.

Roles, as stored in users.role:

    owner   - the person who created a workspace. Full power inside that one
              workspace.
    admin   - platform staff. The only role that may look across workspaces.
    member  - an ordinary teammate. Sees the workspace they belong to, and may
              change the work assigned to them.

There is no owner_id column on Company: a workspace is the set of users whose
role says owner and whose company_id says which one. In practice a workspace
has exactly one.
"""

from fastapi import HTTPException, status

from app.models.user import User

ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MEMBER = "member"


def require_found(resource, resource_name: str):
    """Hand back the object, or answer 404 when it is not there.

    Every lookup in the services goes through this, so "not found" reads the
    same way everywhere instead of becoming an AttributeError on None two
    lines later - which is what the old code did, and what made those requests
    come back as 500 errors.
    """
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found",
        )

    return resource


def same_company(current_user: User, resource_company_id: int) -> None:
    """Refuse when the object belongs to a workspace the caller is not in.

    The blunt version of the tenant rule, used where an action must stay inside
    the caller's own workspace and the caller's role does not matter.
    """
    if current_user.company_id != resource_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company's data",
        )


def can_view_company(current_user: User, company_id: int) -> None:
    """May this caller see inside the given workspace?

    Anyone who belongs to it, plus any platform admin. A member is allowed to
    read the projects and tasks of their own team - the frontend's board is
    built from them - so "member" is not a reason to refuse a read.
    """
    if is_admin(current_user) or current_user.company_id == company_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this company's data",
    )


def can_admin_or_owner(current_user: User, company_id: int) -> None:
    """May this caller change the workspace as a whole?

    Only the workspace's owner, or a platform admin. This guards the things that
    are hard to undo: deleting a project, renaming a workspace, inviting or
    removing people.

    Being a member of the company is deliberately NOT enough. The previous
    version of this check accepted any role as long as the company matched, so
    one teammate could erase another teammate's project.
    """
    if is_admin(current_user):
        return

    if current_user.role == ROLE_OWNER and current_user.company_id == company_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the owner of this company or an admin can do that",
    )


def can_manage_task(current_user: User, task_assigned_to: int | None) -> None:
    """May this caller change or delete this task?

    Three people can: an admin, the workspace owner, and - the common case -
    the teammate the task is actually assigned to. That last one is what makes
    the tick box on the Tasks screen work for ordinary members.

    Whoever is allowed to change a task is allowed to delete it, which is why
    there is no separate can_delete_task().
    """
    if is_admin(current_user):
        return

    if current_user.role == ROLE_OWNER:
        return

    if task_assigned_to is not None and task_assigned_to == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the owner, an admin, or the assigned teammate can change this task",
    )


def is_admin(current_user: User) -> bool:
    """Platform staff, who may cross workspace boundaries."""
    return current_user.role == ROLE_ADMIN


def to_offset(page: int, limit: int) -> int:
    """Turn a page number into the row number a query should start at.

    Page 1 starts at row 0. Both values are clamped, because ?page=0 or
    ?limit=-5 arriving from a hand-written URL is entirely likely, and a
    negative offset is a database error rather than a useful answer.
    """
    safe_page = max(page, 1)
    safe_limit = min(max(limit, 1), 100)

    return (safe_page - 1) * safe_limit
