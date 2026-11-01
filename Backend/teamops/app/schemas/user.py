from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import CompanyDetail


class Base(BaseModel):

    name: str
    email: str
    company_id: int
    role: str


class UserCreate(Base):
    password: str


class UserResponse(BaseModel):
    role: str
    id: int
    name: str
    email: str
    company_id: int
    created_at: datetime
    updated_at: datetime

    company: CompanyDetail

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):

    name: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None


class UserReplace(BaseModel):
    name: str
    email: str
    company_id: int
    password: str
    role: str
