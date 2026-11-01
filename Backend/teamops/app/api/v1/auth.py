from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.services.auth import get_user_by_email_service, get_refresh_token_service

router = APIRouter(prefix="/auth", tags=["Login"])


@router.post("/login", response_model= TokenResponse)
def get_user_by_email(login_request: LoginRequest, db: Session = Depends(get_db)):
    return get_user_by_email_service(db=db, login_request=login_request)

@router.post("/ref_tok")
def get_refresh_token( token: RefreshTokenRequest, db: Session = Depends(get_db) ):
    return get_refresh_token_service( db= db, token= token)