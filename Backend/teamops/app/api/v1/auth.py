"""Authentication endpoints.

This module belongs to the API layer (app/api/v1).

An endpoint here does four things and nothing else: read the request, call one
function from app/services/, wrap the result in the response model, and say
which status code means what. No SQL, no permission tests, no business rules -
putting those here is how two endpoints end up disagreeing about who is allowed
to do something.

The paths are what the frontend calls. They used to be /auth/ref_tok and
/auth/post; they are now the plain REST names, all under the /api/v1 prefix
that app/main.py adds.
"""

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser, DbDep
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth import (
    login_service,
    logout_service,
    refresh_service,
    register_service,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new workspace and sign its owner in",
)
def register(payload: RegisterRequest, db: DbDep):
    """Create a workspace together with the person who owns it.

    This is the entry point for somebody with no account at all, and the
    reason the old "you need a token to make a company, but you need a company
    to get a token" deadlock is gone.

    The response is a normal token pair, so the client behaves identically
    whether the user signed up or signed in.
    """
    return register_service(db=db, payload=payload)


@router.post("/login", response_model=TokenResponse, summary="Sign in")
def login(payload: LoginRequest, db: DbDep):
    """Swap an email and password for a token pair.

    Answers 401 in the same words whether the address is unknown or the
    password was wrong.
    """
    return login_service(db=db, payload=payload)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Exchange a refresh token for a new token pair",
)
def refresh(payload: RefreshTokenRequest, db: DbDep):
    """Rotate the caller's session and hand back fresh tokens.

    No Bearer header is needed for this one, and that is the point: the access
    token has already expired by the time a client needs to call it. The
    refresh token in the body is what gets checked, against the sessions table.

    The old refresh token stops working as soon as this succeeds, so a client
    must replace what it stored rather than keep the previous one.
    """
    return refresh_service(db=db, refresh_token=payload.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="End this session",
)
def logout(payload: RefreshTokenRequest, db: DbDep):
    """Throw one refresh token away.

    The access token is not revoked - it is not stored anywhere, so there is
    nothing to revoke - and simply expires on its own. That is what the short
    lifetime in app/core/config.py is for.
    """
    return {
        "message": logout_service(db=db, refresh_token=payload.refresh_token)
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Who am I, and which workspace do I belong to",
)
def me(current_user: CurrentUser):
    """The signed-in user, with their workspace attached.

    The frontend calls this once on startup to decide what to show: the role
    chooses which buttons are visible, and `company` says which workspace to
    load. It also doubles as the cheapest possible "is my session still alive"
    check.
    """
    return current_user
