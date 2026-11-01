############################################### USER CURD ################
from sqlalchemy.orm import Session

from app.models.user import User


def create_user(db: Session, user_data: dict):

    user_modle = User(**user_data)

    db.add(user_modle)
    db.commit()
    db.refresh(user_modle)

    return user_modle


def get_users(
    db: Session, offset: int, limit: int, search: str | None = None, short: str = "id"
):
    quary = db.query(User)
    if search:
        quary = quary.filter(User.name.ilike(f"%{search}%"))

    if short:
        short_fields = {
            "name": User.name,
            "email": User.email,
            "company_id": User.company_id,
        }
        quary = (
            quary.order_by(short_fields.get(short, User.id)).offset(offset).limit(limit)
        )

    return quary.all()


def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(user_id == User.id).first()
    return user


def update_user(update: dict, db: Session, user_id: int):

    seleted_user = db.query(User).filter(User.id == user_id).first()

    for key, value in update.items():
        setattr(seleted_user, key, value)

    db.commit()
    db.refresh(seleted_user)

    return seleted_user


def delete_user(db: Session, user_id: int):
    seleted_user = db.query(User).filter(User.id == user_id).first()
    db.delete(seleted_user)
    db.commit()
    return {seleted_user.name: "Succesfully Deleted"}


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
