from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import UsersRES


class CompanyBase(BaseModel):
    name: str


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    users: list[UsersRES]

    model_config = ConfigDict(from_attributes=True)


class CompanyUpdate(BaseModel):
    name: str
