"""Turning a Bearer token into the person who sent it.

This module belongs to the DEPENDENCIES layer (app/dependencies).

Every authenticated endpoint says `current_user: CurrentUser` and gets back a
real User object, already checked. That is the one place the "who is calling?"
question is answered, so no endpoint can forget to ask.

About the Swagger "Authorize" button:
    OAuth2PasswordBearer describes a form-encoded login flow, and this API's
    login takes JSON instead. The button therefore cannot fetch a token by
    itself. Paste the `access_token` from a POST /auth/login response into the
    box and the rest of the documentation works normally.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.jwt import decode_access_token
from app.curd.user import get_user_by_id
from app.db.session import get_db
from app.models.user import User

# The path the Swagger UI shows as where a token comes from.
OAuth2Schema = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/login"
)

# Two request parameters, declared once so app/api/v1/ can write `db: DbDep`
# instead of repeating `= Depends(...)` on every single endpoint. Same
# behaviour - FastAPI reads Annotated the same way - with one less thing to
# mistype, and the lint rule about calling functions in defaults stays quiet
# because the call happens here, at import time, in one place.
DbDep = Annotated[Session, Depends(get_db)]
Token = Annotated[str, Depends(OAuth2Schema)]

# One message for every way a token can fail to be useful. Distinguishing them
# would only help somebody trying to work out how the scheme is put together.
_INVALID = "Your session is not valid. Please sign in again"


def get_current_user(token: Token, db: DbDep) -> User:
    """The signed-in user behind this request.

    Three separate things have to be right, and each one is checked in order:

      1. the signature and expiry - so the token was issued here and is current;
      2. the `sub` claim being a whole number - see the note below;
      3. that person still existing in the database.

    Step 3 is why the account is read from the database on every request rather
    than trusted straight from the token. It costs one indexed lookup, and it
    means removing a teammate stops their access immediately, whatever they are
    holding. Without it, a deleted account would keep working until its access
    token expired.
    """
    payload = decode_access_token(token)

    if payload is None:
        raise _unauthorized()

    # `sub` is the user id, written as a string when the token was signed.
    # int() on anything else raises ValueError - and the old code wrapped that
    # in a check for None that could never have been reached, so a handcrafted
    # token produced a 500 and a stack trace instead of a 401.
    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise _unauthorized()

    user = get_user_by_id(db=db, user_id=user_id)

    if user is None:
        raise _unauthorized()

    return user


# The same shorthand as DbDep, declared down here because it can only be built
# once get_current_user exists. This is what every authenticated endpoint
# asks for.
CurrentUser = Annotated[User, Depends(get_current_user)]


def _unauthorized() -> HTTPException:
    """The 401 every failure above answers with.

    `WWW-Authenticate: Bearer` is what a browser or HTTP client looks for to
    know the scheme in use, and is part of the shape the frontend's "session
    over" handling expects.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=_INVALID,
        headers={"WWW-Authenticate": "Bearer"},
    )
