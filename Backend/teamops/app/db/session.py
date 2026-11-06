"""Database engine and session factory.

This module belongs to the DATA LAYER (app/db).

`SessionLocal` is the class every request handler uses, through the
`get_db` dependency defined in app/dependencies/auth.py. One session means one
unit of work: whatever a single request does to the database happens inside it,
and an exception leaves it rolled back rather than half-applied.

The connection string comes from app/core/config.py, so nothing here is
hardcoded.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# pool_pre_ping re-checks a pooled connection before handing it out, so a
# database restart cannot leave the API serving dead connections.
engine = create_engine(settings.database_url, pool_pre_ping=True)

# autocommit and autoflush are off, which is the point: a change only reaches
# the database when a crud function calls commit().
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """FastAPI dependency that yields one session per request.

    Usage in an endpoint:

        @router.get("/projects")
        def list_projects(db: Session = Depends(get_db)):
            ...

    The session is always closed afterwards, even when the request fails, so
    connections go back to the pool instead of leaking.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
