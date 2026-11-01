from app.models.refresh_token import RefreshToken
from datetime import datetime, timedelta, timezone

from app.db.session import Session

def create_refresh_token_db( Token: str, user_id: int,  db: Session ):
    
    modle = RefreshToken(
        token=Token,
    user_id=user_id,
    expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    
    db.add(modle)
    db.commit()
    db.refresh(modle)

def get_refresh_token_db( db: Session, token: str ):

    qury = db.query(RefreshToken).filter( RefreshToken.token == token).first()

    return qury

