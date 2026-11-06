"""The application itself.

This module belongs to the BACKEND ENTRY POINT (app/main.py).

Run it with:

    uvicorn app.main:app --reload

Everything this file does is assembly. It creates the app, says which browsers
may call it, mounts the versioned API, and adds the two health checks that a
load balancer or a `curl` can use. No business rule belongs here.

The routes, in order of how likely you are to need them:

    GET  /health      is the process up?
    GET  /health/db   is the process up AND can it reach Postgres?
    /docs             the interactive API documentation
    /api/v1/*         everything else, from app/api/v1/__init__.py
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.schemas.common import HealthResponse

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
)

# CORS: which browser origins may call this API.
#
# A browser sends a pre-flight request before letting a page on one address
# talk to a server on another. Without this middleware the frontend on
# localhost:3000 is refused by the browser, and the failure looks like a broken
# API rather than a missing permission. The addresses allowed come from
# settings, so adding a deployment means editing a list, not this file.
#
# credentials=True is what would let a cookie travel along; this API uses a
# Bearer header instead, so it is off - which is also the safer default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(IntegrityError)
async def handle_integrity_error(
    request: Request, exc: IntegrityError
) -> JSONResponse:
    """Turn a database refusal into an answer the client can act on.

    The database rejects a write for reasons the service layer cannot easily
    predict: a workspace name that is already taken, a row another row still
    points at, a foreign key that is not there. Left alone, each of those
    becomes a 500 with a stack trace, which tells the user nothing and tells an
    attacker the schema.

    Nothing is rolled back here, and nothing needs to be: the failed statement
    already ended the transaction, and when the request's session is closed the
    connection goes back to the pool in a clean state. What is left to do is
    say what happened, in one line, without the database's own text.

    A duplicate is a clash with existing data, which is exactly what 409 means.
    """
    return JSONResponse(
        status_code=409,
        content={"detail": "That change clashes with something already stored"},
    )


@app.get("/", response_model=dict, include_in_schema=False)
def read_root() -> dict:
    """A landing page for whoever opens the port in a browser.

    Points at the two things a newcomer actually wants: the documentation, and
    a way to check the service is awake.
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "api": settings.api_v1_prefix,
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health() -> HealthResponse:
    """Is the process running?

    Deliberately does not touch the database: a health check that fails for a
    reason other than the thing it is checking is worse than no check. Use
    /health/db when you want the database included.
    """
    return {"status": "ok"}


@app.get("/health/db", response_model=HealthResponse, tags=["Health"])
def health_db() -> HealthResponse:
    """Can this process reach Postgres, right now, over its real connection?

    This is the one to run after starting the container, and the one that would
    have caught the port and URL mistakes this project did make. Its answer is
    "unreachable" plus the reason, rather than a 500, so a monitoring system
    can read it the same way as the OK case.
    """
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))

        return {"status": "ok", "database": "connected"}
    except Exception as exc:  # noqa: BLE001 - see the note below
        # Catching everything here is deliberate. Whatever went wrong, the
        # answer a monitoring system needs is the same one: "the database is
        # not answering, and here is why". Letting it escape would turn the
        # health check into a 500, and a 500 from /health/db looks exactly
        # like the app being down.
        return {"status": "degraded", "database": f"unreachable: {exc}"}
    finally:
        db.close()


# Every endpoint from app/api/v1/, under one prefix. Keeping the version in the
# path means a future /api/v2 can be mounted beside this one instead of
# replacing it out from under clients that have not caught up.
app.include_router(api_router, prefix=settings.api_v1_prefix)
