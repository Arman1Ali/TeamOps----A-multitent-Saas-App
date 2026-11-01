from fastapi import FastAPI

from app.api.v1.auth import router as auth_router
from app.api.v1.company import router as company_router
from app.api.v1.Project import route as project_router
from app.api.v1.task import route as task_router
from app.api.v1.user import router as user_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
)

app.include_router(company_router)

app.include_router(user_router)

app.include_router(auth_router)

app.include_router(project_router)

app.include_router(task_router)
