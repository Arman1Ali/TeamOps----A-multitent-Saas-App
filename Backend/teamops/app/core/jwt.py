"""JSON Web Token helpers.

This module belongs to the BACKEND SECURITY layer (app/core).

Two different tokens exist in this app, and it is worth keeping them straight:

* access token  - a signed JWT. Short lived. Sent as `Authorization: Bearer`
                  on every request, and decoded (not looked up) to learn who
                  the caller is.
* refresh token - a long random string, NOT a JWT. Long lived. Stored in the
                  `refresh_tokens` table so it can be revoked, and exchanged
                  for a brand new pair at /auth/refresh.

Nothing outside this file should know the secret key.
"""

import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings


def create_access_token(data: dict) -> str:
    """Sign a short lived access token.

    `data` must contain `{"sub": "<user id>"}` - that claim is what
    get_current_user() later reads to identify the caller.
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    """Verify and decode an access token.

    Returns the payload, or None when the token is tampered with, malformed or
    expired. The caller turns a None into an HTTP 401.

    `algorithms` must be a list - passing the bare string is the kind of mistake
    that looks like it works until a token is actually checked.
    """
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None


def create_refresh_token() -> str:
    """Make a long, unguessable refresh token string.

    This is random rather than signed on purpose: its record lives in the
    database, so the server can delete it and end the session immediately.
    How long a session lasts is decided where the row is written, in
    app/curd/auth.py.
    """
    return secrets.token_urlsafe(64)
