"""Business rules for users.

This module belongs to the SERVICE layer (app/services).

Adding a teammate, reading the roster and changing a person all happen inside
the caller's own workspace. The two things worth pausing on are roles and
passwords:

* promoting someone to owner hands them the whole workspace, so only an owner
  may do it - and nobody may promote themselves;
* changing a password ends every session that belongs to the account, because
  the old tokens were handed out before whoever is now in control of the
  password existed.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.curd.auth import delete_sessions_for_user
from app.curd.user import (
    create_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.common import (
    ROLE_OWNER,
    can_admin_or_owner,
    can_view_company,
    is_admin,
    require_found,
    same_company,
    to_offset,
)


def create_user_service(
    db: Session, user_data: UserCreate, current_user: User
) -> User:
    """Add a teammate to the caller's workspace.

    Two rules this enforces that the old code did not:

    * the newcomer always lands in the caller's company. `company_id` is not
      even a field on UserCreate, so there is nothing to ignore;
    * only an owner or an admin may add anybody at all, and only an owner may
      hand out the owner role - that role can change the whole workspace, so it
      should not be something a teammate can grant.
    """
    can_admin_or_owner(current_user, current_user.company_id)

    data = user_data.model_dump()

    if data["role"] == ROLE_OWNER and current_user.role != ROLE_OWNER:
        raise HTTPException(
            status_code=403,
            detail="Only the workspace owner can invite somebody as an owner",
        )

    data["company_id"] = current_user.company_id
    data["password"] = hash_password(data["password"])

    return create_user(db=db, user=data)


def get_users_service(
    db: Session,
    current_user: User,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
) -> list[User]:
    """The caller's own roster.

    Every member may read it - the Team screen and the "who do I assign this
    to?" menu both need the names - but nobody may read another workspace's.
    """
    can_view_company(current_user, current_user.company_id)

    return get_users(
        db=db,
        company_id=current_user.company_id,
        offset=to_offset(page, limit),
        limit=limit,
        search=search,
    )


def get_user_by_id_service(db: Session, user_id: int, current_user: User) -> User:
    """One teammate's details.

    The frontend's project cards ask for this by id to turn a stored user id
    back into a name, so it is read often and by everyone.
    """
    user = require_found(get_user_by_id(db=db, user_id=user_id), "User")

    can_view_company(current_user, user.company_id)

    return user


def update_user_service(
    db: Session, user_id: int, update: UserUpdate, current_user: User
) -> User:
    """Change a person: their name, address, password, or role.

    Who may do what:

    * anybody may edit their own profile;
    * an owner may edit anyone inside their workspace, and an admin anyone
      anywhere;
    * only an owner or admin may change a role, so a member cannot promote
      themselves;
    * a member editing their own profile cannot smuggle a role change into the
      same request.

    The password branch does the extra work: hashing the new one, and signing
    the account out everywhere else.
    """
    user = require_found(get_user_by_id(db=db, user_id=user_id), "User")

    editing_self = user.id == current_user.id

    if not editing_self:
        # Not yourself, so this needs workspace authority - and the target has
        # to be in the caller's workspace first.
        same_company(current_user, user.company_id)
        can_admin_or_owner(current_user, user.company_id)

    update_data = update.model_dump(exclude_unset=True)

    if "role" in update_data:
        if not (current_user.role == ROLE_OWNER or is_admin(current_user)):
            raise HTTPException(
                status_code=403,
                detail="Only the workspace owner or an admin can change roles",
            )

        if update_data["role"] == user.role:
            # Asking to be set to the role you already hold is not a change.
            del update_data["role"]

    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])

    if not update_data:
        return user

    updated = update_user(db=db, user_id=user_id, update=update_data)

    require_found(updated, "User")

    if "password" in update_data:
        # Every session this person had was opened with the old password.
        delete_sessions_for_user(db=db, user_id=user_id)

    return updated


def delete_user_service(db: Session, user_id: int, current_user: User) -> str:
    """Remove a teammate from the workspace.

    Owner or admin only, and never yourself: a person who deletes their own
    account while signed in leaves a token pointing at a row that no longer
    exists, and the screen they were using behind them.

    Their tasks survive. app/curd/user.py puts them back in the unassigned pile
    first, so the work is not lost when the person is.
    """
    user = require_found(get_user_by_id(db=db, user_id=user_id), "User")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own account. Ask another owner to do it",
        )

    can_admin_or_owner(current_user, user.company_id)

    deleted = delete_user(db=db, user_id=user_id)

    require_found(deleted, "User")

    return f"Removed {deleted.name} from the workspace"
