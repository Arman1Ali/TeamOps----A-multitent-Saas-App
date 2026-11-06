"""Business rules for signing in, signing up and sessions.

This module belongs to the SERVICE layer (app/services).

This is the part of the backend a client has to understand, so the four calls
are worth stating in order:

    register_service  POST /auth/register  - no token. Starts a workspace and
                              its first owner, then signs that owner in.
    login_service     POST /auth/login     - no token. Checks the password and
                              issues a token pair.
    refresh_service   POST /auth/refresh   - refresh token only. Throws the old
                              pair away and hands out a new one. This is the
                              only call that needs the database, which is the
                              point of storing sessions.
    logout_service    POST /auth/logout    - deletes one session row.

An access token is never looked up here: it is verified by its signature in
app/dependencies/auth.py, on every other request.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.jwt import create_access_token
from app.core.security import verify_password
from app.curd.auth import create_session, delete_session, get_active_session
from app.curd.user import get_user_by_email, get_user_by_id
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.company import create_company_with_owner

# Shown for a wrong email and a wrong password alike. Saying which one was
# wrong would tell an attacker which addresses have accounts here.
_BAD_CREDENTIALS = "Email or password is incorrect"


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    """Sign an access token and open a session, as one answer.

    Shared by register and login because both end in the same place: a person
    who has just proved who they are, needing something to send on the next
    request.

    `sub` is the user id as a string. It is the only claim anything downstream
    reads, in app/dependencies/auth.py.
    """
    access_token = create_access_token(data={"sub": str(user.id)})

    session = create_session(db=db, user_id=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=session.token,
        token_type="bearer",
    )


def register_service(db: Session, payload: RegisterRequest) -> TokenResponse:
    """Start a brand new workspace, and sign its owner straight in.

    This endpoint is what the old API could not do: creating a workspace wanted
    a signed-in caller, but a signed-in caller only exists once a workspace
    does. Here both halves appear together, with no token and nothing to point
    at beforehand.

    The workspace and its owner are written by
    app/services/company.py:create_company_with_owner(), which raises a 409 if
    the email address is already taken.
    """
    create_company_with_owner(
        db=db,
        company_name=payload.company_name,
        owner_name=payload.name,
        owner_email=payload.email,
        owner_password=payload.password,
    )

    # Read the owner back rather than rebuilding an object from what was just
    # typed in: this is the row that now exists, hash and all.
    owner = get_user_by_email(db=db, email=payload.email)

    if owner is None:
        # Only reachable if the insert above somehow did not happen, which
        # would already have raised. Reported as a server fault rather than
        # pretending the client did something wrong.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The workspace was created but its owner could not be found",
        )

    return _issue_tokens(db=db, user=owner)


def login_service(db: Session, payload: LoginRequest) -> TokenResponse:
    """Check an email and password, and hand out a token pair.

    Two separate failures are answered with one message on purpose:

      * nobody holds that email address;
      * somebody does, but the password did not match.

    Telling them apart would turn the login box into a way to discover which
    email addresses have accounts here.
    """
    user = get_user_by_email(db=db, email=payload.email)

    if user is None or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_BAD_CREDENTIALS,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _issue_tokens(db=db, user=user)


def refresh_service(db: Session, refresh_token: str) -> TokenResponse:
    """Trade a live refresh token for a brand new pair.

    This is rotation, and it is why sessions are stored in the database at all:

      1. look the token up, together with its expiry, in one query;
      2. delete it, so the string can only ever be used once;
      3. issue a new access token and a new refresh token.

    A client that replays the old string after this is refused, because its row
    is gone - which is also how a stolen token gets cut off for good, once the
    real person signs in again.

    An unknown token and an expired one get the same answer: a 401 shaped like
    a bad access token, so the frontend can react to either by showing the
    login screen.
    """
    session = get_active_session(db=db, token=refresh_token)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has ended. Please sign in again",
        )

    user = get_user_by_id(db=db, user_id=session.user_id)

    if user is None:
        # The account was removed while this session was still alive. Cleaning
        # up after itself means the dead string cannot be tried again.
        delete_session(db=db, token=refresh_token)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has ended. Please sign in again",
        )

    delete_session(db=db, token=refresh_token)

    return _issue_tokens(db=db, user=user)


def logout_service(db: Session, refresh_token: str) -> str:
    """End one session.

    A token that is not in the table is not an error worth reporting: from the
    caller's point of view they are signed out either way, and saying so
    quietly beats a 404 on a sign-out button.
    """
    delete_session(db=db, token=refresh_token)

    return "Signed out of this device"
