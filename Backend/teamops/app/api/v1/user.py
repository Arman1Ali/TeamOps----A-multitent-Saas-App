"""User endpoints.

This module belongs to the API layer (app/api/v1).

The roster of the caller's own workspace: reading it, inviting somebody to it,
changing a person, taking them out of it.

Nobody can reach another workspace's people through these paths. `company_id`
is not a parameter anywhere in this file, because the service always derives it
from the token - see app/services/user.py.
"""

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser, DbDep
from app.schemas.auth import MessageResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import (
    create_user_service,
    delete_user_service,
    get_user_by_id_service,
    get_users_service,
    update_user_service,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: DbDep,
    current_user: CurrentUser,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    """The caller's teammates, ordered by name.

    The Team screen asks for this, and so does the "who should do this task?"
    menu - which is why the response carries `initials`: an avatar can be drawn
    from what is already here, with no second call.

    A workspace rarely has more than a few dozen people, so `limit` defaults
    high enough to cover the whole roster in one go.
    """
    return get_users_service(
        db=db, current_user=current_user, page=page, limit=limit, search=search
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Invite a teammate into the caller's workspace.

    Owner or admin. Granting the `owner` role takes an owner specifically, so a
    member cannot hand out the power to change everything in the workspace -
    and cannot hand it to themselves either.
    """
    return create_user_service(db=db, user_data=user, current_user=current_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """One teammate by id.

    Mainly for turning a stored user id back into a name and initials when the
    frontend has only the number to work with.
    """
    return get_user_by_id_service(db=db, user_id=user_id, current_user=current_user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: DbDep,
    current_user: CurrentUser,
):
    """Change a person: name, email address, password, or role.

    You may edit yourself. Editing anybody else needs owner or admin, and a
    role change always does. A password here is hashed before it is stored, and
    signs the account out on every other device - see
    app/services/user.py:update_user_service().
    """
    return update_user_service(
        db=db, user_id=user_id, update=user, current_user=current_user
    )


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    db: DbDep,
    current_user: CurrentUser,
):
    """Take a teammate out of the workspace.

    Owner or admin, and never yourself. Their tasks are not deleted: they go
    back to the unassigned pile first, so the work outlives the person. See
    app/curd/user.py for the order those statements run in and why it matters.
    """
    return {
        "message": delete_user_service(
            db=db, user_id=user_id, current_user=current_user
        )
    }
