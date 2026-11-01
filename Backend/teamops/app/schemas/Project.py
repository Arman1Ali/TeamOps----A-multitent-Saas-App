from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):

    name: str
    description: str
    company_id: int


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    company_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectUpdate(BaseModel):

    name: str
    description: str
    company_id: int
