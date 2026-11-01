from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.jwt import decode_access_token
from app.curd.user import get_user_by_id
from app.db.session import get_db

OAuth2Schema = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(OAuth2Schema), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invaild or expire token"
        )

    sub = int(payload.get("sub"))

    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user = get_user_by_id(db=db, user_id=sub)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User Not Found"
        )
    return user
