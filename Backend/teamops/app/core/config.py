"""Application settings.

This module belongs to the BACKEND CONFIGURATION layer (app/core).

Every value here can be overridden by a matching environment variable, or by a
line in Backend/teamops/.env. For example the variable name for `database_url`
is `DATABASE_URL` (pydantic-settings matches them case-insensitively).

Keeping configuration in one place means no other module has to hardcode a
secret, a port, or a timeout of its own.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Information shown in the OpenAPI/Swagger UI ---
    app_name: str = "TeamOps API"
    app_version: str = "0.1.0"
    app_description: str = "A multi-tenant SaaS project management API."

    # --- Database ---
    # Points at the Postgres container that compose.yaml starts.
    # compose.yaml publishes container port 5432 on host port 5433, so the
    # host-side URL must say 5433.
    database_url: str = (
        "postgresql+psycopg://teamops:teamops_dev_password@localhost:5433/teamops"
    )

    # --- JWT / authentication ---
    # Never ship a real production secret here: set SECRET_KEY in .env instead.
    secret_key: str = "change-me-in-env"
    algorithm: str = "HS256"

    # How long an access token stays valid, and how long a refresh token is
    # remembered in the database before it expires.
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # --- Browser access (CORS) ---
    # The frontend runs on its own origin, so the browser only allows the
    # request if that origin appears in this list.
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Everything under this prefix is the versioned API, e.g. /api/v1/projects.
    api_v1_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
