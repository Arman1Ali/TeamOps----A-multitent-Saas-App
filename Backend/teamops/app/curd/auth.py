"""Database queries for sessions (the refresh token table).

This module belongs to the CRUD layer (app/curd).

A "session" is one row in `refresh_tokens`: one person, signed in on one
device. This file is the only place that writes or removes those rows.

About time:
    The column is `TIMESTAMP WITHOUT TIME ZONE`, and the value stored in it is
    Coordinated Universal Time. `created_at` gets that from the database's own
    now() default, and `expires_at` is computed the same way below. Keeping both
    sides on UTC is what lets a comparison work at all, so the helper here
    returns a UTC timestamp with the zone label stripped off - and the
    comparison is done in SQL rather than in Python, where mixing an aware and
    a naive datetime would raise a TypeError.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.jwt import create_refresh_token
from app.models.refresh_token import RefreshToken


def _utc_now() -> datetime:
    """The current UTC moment, without a timezone label.

    Matches what the database column holds. Do not "fix" this into an aware
    datetime: the two would then disagree by whatever offset this machine runs
    at, and sessions would expire early or late.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_session(db: Session, user_id: int) -> RefreshToken:
    """Open a session for one person and return its row.

    The token string itself comes from app/core/jwt.py; this function only
    decides when it stops being valid, using the lifetime set in
    app/core/config.py.
    """
    session = RefreshToken(
        token=create_refresh_token(),
        user_id=user_id,
        created_at=_utc_now(),
        expires_at=_utc_now() + timedelta(days=settings.refresh_token_expire_days),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_active_session(db: Session, token: str) -> RefreshToken | None:
    """The session a token refers to, but only if it is still valid.

    Two separate reasons a caller can be refused, and this returns None for
    both: the token was never issued (or has been rotated away), and the token
    is real but past its expiry. The response is the same either way - a 401 -
    because telling them apart would hand an attacker a way to test whether a
    stolen string is still live.

    Checking `expires_at` inside the query is deliberate: the database does the
    comparison, so there is no chance of mixing the two timestamp flavours.
    """
    return (
        db.query(RefreshToken)
        .filter(RefreshToken.token == token, RefreshToken.expires_at > _utc_now())
        .one_or_none()
    )


def get_session_by_token(db: Session, token: str) -> RefreshToken | None:
    """The session a token refers to, expired or not.

    Only used by logout, where a dead token is not an error worth reporting:
    the person has already signed out, and deleting nothing is the right answer.
    """
    return db.query(RefreshToken).filter(RefreshToken.token == token).one_or_none()


def delete_session(db: Session, token: str) -> bool:
    """End one session. True when there was something to end.

    Used by the rotation in app/services/auth.py: the old token is dropped
    before the new one is written, so a session is never left with two live
    refresh tokens at once.
    """
    deleted = db.query(RefreshToken).filter(RefreshToken.token == token).delete()

    db.commit()

    return deleted > 0


def delete_sessions_for_user(db: Session, user_id: int) -> int:
    """End every session one person has, on every device.

    Called when a password changes. The old sessions still hold valid tokens,
    and there is no better reason to throw them away than the fact that
    somebody just proved they know the new password.

    Returns how many rows went, which endpoints report back to the caller.
    """
    deleted = (
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    )

    db.commit()

    return deleted
