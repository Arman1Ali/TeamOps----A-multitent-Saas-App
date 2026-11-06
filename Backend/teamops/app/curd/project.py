"""Database queries for projects.

This module belongs to the CRUD layer (app/curd).

CRUD stands for Create, Read, Update, Delete. This layer holds the queries and
nothing else: it never decides who is allowed to do something, and never raises
an HTTP error. Those decisions belong to app/services/project.py.

Every read here is scoped to one company. That is not a style choice - the
previous version of this file had no company filter at all, so any signed-in
user could list every workspace's projects.
"""

from sqlalchemy.orm import Session

from app.models.project import Project

# What the API accepts in ?sort=, mapped onto real columns. Kept as a plain
# dictionary so an unexpected value falls back to created_at.
ALLOWED_SORTS = {
    "created_at": "created_at",
    "name": "name",
    "progress": "progress",
    "due_date": "due_date",
    "status": "status",
}


def create_project(db: Session, project: dict) -> Project:
    """Insert one project row and hand back the saved object.

    Takes a plain dictionary, already cleaned by the schema layer and already
    carrying the right company_id.
    """
    db_project = Project(**project)

    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return db_project


def get_projects(
    db: Session,
    company_id: int,
    offset: int = 0,
    limit: int = 10,
    sort: str = "created_at",
    search: str | None = None,
) -> list[Project]:
    """One page of a single workspace's projects.

    `sort` is looked up in ALLOWED_SORTS rather than handed to getattr()
    directly, so a query string cannot reach an attribute the model does not
    mean to expose.
    """
    query = db.query(Project).filter(Project.company_id == company_id)

    if search:
        # ilike is case-insensitive matching; the wildcards are added here
        # rather than expected from the caller.
        query = query.filter(Project.name.ilike(f"%{search}%"))

    order = getattr(Project, ALLOWED_SORTS.get(sort, "created_at"))

    # Newest first when the caller did not ask for a particular column.
    if sort == "created_at":
        query = query.order_by(order.desc())
    else:
        query = query.order_by(order.asc())

    return query.offset(offset).limit(limit).all()


def get_project_by_id(db: Session, project_id: int) -> Project | None:
    """One project by its id, or None when there is no such project.

    Returning None instead of raising is what lets the service layer decide that
    this is a 404 - the query layer has no business knowing about HTTP.

    This deliberately does not filter by company: the service layer compares
    `project.company_id` against the caller and answers 403 when it differs, so
    the client gets a clear reason instead of a bare "not found".
    """
    return db.get(Project, project_id)


def update_project(db: Session, project_id: int, update: dict) -> Project | None:
    """Change the columns the caller actually sent.

    An empty dictionary means "change nothing", so it is applied as-is rather
    than treated as an error.

    The old version called `db.commit()` on an object it had never fetched, and
    returned the input dictionary instead of the saved row.
    """
    project = db.get(Project, project_id)

    if project is None:
        return None

    for field, value in update.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


def delete_project(db: Session, project_id: int) -> Project | None:
    """Remove a project, and with it every task inside it.

    The tasks go because Project.tasks is declared with
    cascade="all, delete-orphan" in app/models/project.py. Without that, this
    delete would be refused by the database because task rows still point at
    the project, and the user would see a confusing 500.

    Returns the deleted object so the caller can name it in a message.
    """
    project = db.get(Project, project_id)

    if project is None:
        return None

    db.delete(project)
    db.commit()

    return project
