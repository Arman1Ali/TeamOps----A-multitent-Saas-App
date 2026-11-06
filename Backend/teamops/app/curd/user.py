"""Database queries for users.

This module belongs to the CRUD layer (app/curd).

Queries only. Whether the caller is allowed to add or remove a person is decided
in app/services/user.py.

One rule runs through this file: a user is always read inside their own
company. `email` is the one lookup that crosses companies, because that is how
login finds an account before you know where it belongs.
"""

from sqlalchemy.orm import Session, joinedload

from app.models.refresh_token import RefreshToken
from app.models.task import Task
from app.models.user import User


def create_user(db: Session, user: dict) -> User:
    """Insert one person.

    The dictionary must already hold a hashed password - hashing happens in
    app/services/user.py, because this layer knows nothing about security.
    """
    db_user = User(**user)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """One person by id, with their company loaded.

    The join lets the service read `user.company_id` and answer a permission
    question without a second round trip.
    """
    return (
        db.query(User)
        .options(joinedload(User.company))
        .filter(User.id == user_id)
        .one_or_none()
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    """One person by email address, or None.

    This is the only cross-company lookup in the file, and it has to be: login
    starts from an email address alone. The caller compares the result against
    nothing else, so the email column's unique index is what makes this safe to
    call at all.

    Passwords are never returned from here in a response - see
    UserResponse in app/schemas/user.py.
    """
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    company_id: int,
    offset: int = 0,
    limit: int = 10,
    search: str | None = None,
) -> list[User]:
    """One page of a single workspace's roster.

    The Team screen shows the whole team at once, so a caller that wants
    everybody passes a limit big enough to cover them.
    """
    query = (
        db.query(User)
        .filter(User.company_id == company_id)
        .options(joinedload(User.company))
        .order_by(User.name.asc())
    )

    if search:
        # Searching the roster means looking at who people are called, or how
        # to reach them.
        query = query.filter(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    return query.offset(offset).limit(limit).all()


def update_user(db: Session, user_id: int, update: dict) -> User | None:
    """Change the fields the caller actually sent.

    Returns None when there is no such person. An empty dictionary leaves the
    row untouched.
    """
    user = db.get(User, user_id)

    if user is None:
        return None

    for field, value in update.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: int) -> User | None:
    """Remove a person, and free the tasks they were holding.

    The extra step here is the point. Task rows carry a foreign key to
    users.id, so deleting somebody with work assigned would be refused by the
    database. Blanketing those assignments first means the person leaves and the
    work survives, back in the unassigned pile where someone else can pick it up.

    Their refresh tokens go too, so a session cannot outlive the account it
    belongs to.

    Both bulk statements run before the person is deleted, which is the order
    the database needs: nothing may still point at the row being removed.
    synchronize_session=False tells SQLAlchemy not to go looking for the
    affected objects in memory - this session only knows about the one user.
    """
    user = db.get(User, user_id)

    if user is None:
        return None

    db.query(Task).filter(Task.assigned_to == user_id).update(
        {Task.assigned_to: None}, synchronize_session=False
    )

    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(
        synchronize_session=False
    )

    db.delete(user)
    db.commit()

    return user
