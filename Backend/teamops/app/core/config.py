from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TeamOps API"
    app_version: str = "0.1.0"
    app_description: str = "A multi-tenant SaaS project management API."
    database_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
