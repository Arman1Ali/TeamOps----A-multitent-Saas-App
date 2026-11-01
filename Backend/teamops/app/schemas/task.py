from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):

    title: str
    description: str
    status: str
    priority: str
    project_id: int
    assigned_to: str


class TaskResponse(BaseModel):

    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: int
    assigned_to: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskUpdate(BaseModel):

    title: str
    description: str
    status: str
    priority: str
    assigned_to: str
