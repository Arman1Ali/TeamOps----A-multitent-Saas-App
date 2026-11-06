"""The RefreshToken table.

This module belongs to the DATA MODEL layer (app/models).

One row is one live session. The refresh token string is stored here so a
session can be ended from the server side, which a stateless JWT cannot do on
its own.

The flow these rows support:

    login           -> a row is created, and its token is sent to the client
    /auth/refresh   -> the row is found, checked, then REPLACED by a new one
                       (that swap is called "rotation")
    /auth/logout    -> the row is deleted, so the token stops working

`expires_at` is a real timestamp, which is what makes the comparison in
app/curd/auth.py possible. It was previously typed as an integer column, a
mistake that could never have worked.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)

    # The secret string handed to the client. Unique, because lookups happen by
    # it and two people must never hold the same session. The width matches the
    # column the existing migration created.
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)

    # Whose session this is. Indexed because rotation looks a token up and then
    # reads its owner, and because deleting a user drops their sessions.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # When the session opened. The database fills this in, matching the default
    # already present on the column.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # When the session stops being accepted. Set by the caller, because it is
    # the policy in app/core/config.py that decides the length.
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
