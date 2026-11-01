from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.jwt import create_acces_token, create_refresh_token
from app.core.security import verify_password
from app.curd.user import get_user_by_email
from app.schemas.auth import LoginRequest, RefreshTokenRequest
from app.curd.auth import create_refresh_token_db, get_refresh_token_db


def get_user_by_email_service(db: Session, login_request: LoginRequest):
    user = get_user_by_email(
        db=db,
        email=login_request.email
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(login_request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_acces_token(
        data={"sub": str(user.id)}
    )

    refresh_token = create_refresh_token()

    create_refresh_token_db(
        Token=refresh_token,
        user_id=user.id,
        db=db
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
def get_refresh_token_service(db: Session, token: RefreshTokenRequest):
    db_value= get_refresh_token_db( db= db, token= token.refresh_token)

    if db_value is None:
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail="You Are valid"
        )

    return db_value