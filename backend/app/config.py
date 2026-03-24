from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://teleprogreso:teleprogreso@localhost:5432/teleprogreso"
    secret_key: str = "cambiar-en-produccion-usar-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24


settings = Settings()
