from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Por defecto SQLite en ./teleprogreso.db (evita errores de codificación de psycopg2 en Windows).
    # Para PostgreSQL: DATABASE_URL=postgresql+psycopg2://teleprogreso:teleprogreso@localhost:5432/teleprogreso
    database_url: str = "sqlite:///./teleprogreso.db"
    secret_key: str = "cambiar-en-produccion-usar-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24


settings = Settings()
