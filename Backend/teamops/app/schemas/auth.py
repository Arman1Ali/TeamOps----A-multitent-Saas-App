"""Authentication request and response shapes.

This module belongs to the SCHEMA layer (app/schemas).

These are the messages of the login flow, which is worth stating plainly
because it is the part of the API a client has to get right:

    POST /auth/register  -> start a brand new workspace, no token needed
    POST /auth/login     -> existing account, returns a token pair
    POST /auth/refresh   -> swap a refresh token for a fresh pair
    POST /auth/logout    -> throw a refresh token away

A password only ever travels in the request direction. No response in this file
has a password field.
"""

from pydantic import BaseModel, Field

from app.schemas.common import EmailString


class LoginRequest(BaseModel):
    """Body of POST /auth/login."""

    email: EmailString

    # Sent as plain text over the wire, which is why the API must run on HTTPS
    # in production. It is compared against an Argon2 hash, never stored.
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    """Body of POST /auth/register.

    This solves the problem the old API had: there was no way to become a user.
    A company could only be created by someone already signed in, and you could
    only sign in once a company existed.

    So one call creates both halves of a new workspace: the company, and the
    owner inside it. There is no company_id field because there is nothing to
    point at yet.
    """

    company_name: str = Field(min_length=1, max_length=100)

    name: str = Field(min_length=1, max_length=50)

    email: EmailString

    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    """What login, register and refresh all return.

    The client keeps `access_token` in memory and sends it as a Bearer header;
    `refresh_token` is what gets exchanged when that header stops being
    accepted.
    """

    access_token: str

    refresh_token: str

    # Fixed value, part of the shape browsers and OAuth clients expect.
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Body of POST /auth/refresh and POST /auth/logout."""

    refresh_token: str = Field(min_length=1)


class MessageResponse(BaseModel):
    """A plain confirmation, for endpoints with nothing useful to return."""

    message: str
