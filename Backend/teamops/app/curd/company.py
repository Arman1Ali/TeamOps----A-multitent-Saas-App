"""Database queries for companies (workspaces).

This module belongs to the CRUD layer (app/curd).

Queries only. The rules about who may see or change a workspace live in
app/services/company.py.

A Company is a tenant. Its rows are spread across users, projects and - one
step further - tasks and sessions, which is why removing one takes more than a
single delete.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.company import Company
from app.models.project import Project
from app.models.refresh_token import RefreshToken
from app.models.task import Task
from app.models.user import User


def create_company(db: Session, name: str) -> Company:
    """Insert a workspace with nothing in it yet.

    This flushes rather than commits, on purpose. A workspace is only ever
    created together with its first owner - see
    app/services/company.py:create_company_with_owner() - and the two rows have
    to appear in the same transaction. Flushing sends the INSERT so that
    `company.id` is filled in and readable, while leaving the decision of when
    to make it permanent to the caller. If the owner insert then fails, the
    workspace disappears with the rollback instead of surviving as an empty,
    unownable row.
    """
    company = Company(name=name)

    db.add(company)
    db.flush()

    return company


def get_company_by_id(db: Session, company_id: int) -> Company | None:
    """One workspace, with its teammates and projects loaded.

    Both joins are pulled in the same statement because the Team screen needs
    the roster and the workspace name at once. Without them the response model
    would fire off one extra query per relationship, quietly.
    """
    return (
        db.query(Company)
        .options(joinedload(Company.users), joinedload(Company.projects))
        .filter(Company.id == company_id)
        .one_or_none()
    )


def get_companies(db: Session, company_ids: list[int] | None = None) -> list[Company]:
    """The workspaces a caller is allowed to see.

    `company_ids` is how the multi-tenant rule reaches this layer. A member or
    an owner gets their own id in that list and therefore sees exactly one
    workspace; an admin gets the ids of every company, so the same function
    answers both cases without knowing anything about roles.

    Passing None lists everything - reserved for an admin dashboard, never
    reachable from an ordinary endpoint.

    Both relationships are loaded up front because CompanyDetail shows them:
    without the second join, rendering the list would fire one extra query per
    workspace without saying so.
    """
    query = db.query(Company).options(
        joinedload(Company.users), joinedload(Company.projects)
    )

    if company_ids is not None:
        query = query.filter(Company.id.in_(company_ids))

    return query.order_by(Company.name.asc()).all()


def update_company(db: Session, company_id: int, name: str) -> Company | None:
    """Rename a workspace.

    Renaming is the only change supported, so the function takes the new name
    directly rather than a dictionary of fields that might include ones nobody
    should be able to set.
    """
    company = db.get(Company, company_id)

    if company is None:
        return None

    company.name = name

    db.commit()
    db.refresh(company)

    return company


def delete_company(db: Session, company_id: int) -> str | None:
    """Remove a workspace and everything inside it. Returns its name.

    This is the one place in the backend where order really matters. The
    database refuses to delete a row that another row still points at, and a
    workspace is pointed at from four directions at once, so the statements run
    outside-in:

      1. hand back any task assigned to one of its people - a task in ANOTHER
         workspace must survive, only the assignment goes;
      2. drop its people's sessions, so nobody stays signed in to a workspace
         that no longer exists;
      3. drop the tasks inside its projects;
      4. drop the projects;
      5. drop the people;
      6. and only then the workspace itself.

    Steps 3 to 6 are bulk statements with subqueries rather than loaded
    objects, and that is not only for speed. Deleting the Company through the
    ORM would make SQLAlchemy null out `company_id` on every user and project
    it still holds in memory - rows that the statements above have already
    removed - which fails with a StaleDataError instead of quietly succeeding.
    Nothing is handed to the ORM to delete, so nothing can be stale.

    The name is read before the rows go, because afterwards there is no row
    left to read it from.

    Everything happens in one transaction: a failure anywhere leaves the
    workspace completely intact rather than half erased.
    """
    company = db.get(Company, company_id)

    if company is None:
        return None

    name = company.name

    member_ids = select(User.id).where(User.company_id == company_id)
    project_ids = select(Project.id).where(Project.company_id == company_id)

    db.query(Task).filter(Task.assigned_to.in_(member_ids)).update(
        {Task.assigned_to: None}, synchronize_session=False
    )

    db.query(RefreshToken).filter(RefreshToken.user_id.in_(member_ids)).delete(
        synchronize_session=False
    )

    db.query(Task).filter(Task.project_id.in_(project_ids)).delete(
        synchronize_session=False
    )

    db.query(Project).filter(Project.company_id == company_id).delete(
        synchronize_session=False
    )

    db.query(User).filter(User.company_id == company_id).delete(
        synchronize_session=False
    )

    db.query(Company).filter(Company.id == company_id).delete(synchronize_session=False)

    db.commit()

    return name
