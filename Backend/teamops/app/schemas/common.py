from pydantic import BaseModel, ConfigDict


class CompanyDetail(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UsersRES(BaseModel):
    id: int
    name: str
    email: str
