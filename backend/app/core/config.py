from pydantic import BaseSettings, RedisDsn
import secrets


class Settings(BaseSettings):
    # Debug Config
    DEBUG: bool = False

    # App Config
    APP_VERSION: str | None = None
    API_STR: str = "/api"
    ENVIRONMENT: str = "local"

    # MongoDB Config
    MongoDB_DSN: str = ""
    MongoDB_DB_NAME: str = ""

    # Redis Config
    REDIS_DSN: RedisDsn = RedisDsn("redis://localhost:16279/0", scheme="redis")  # type: ignore

    # Sentry Config
    SENTRY_DSN: str = ""

    # Minio Config
    MINIO_ACCESS_KEY_ID: str = ""
    MINIO_ACCESS_KEY_SECRET: str = ""
    MINIO_ENDPOINT: str = ""
    MINIO_INTERNAL_ENDPOINT: str = ""
    MINIO_BUCKET: str = ""

    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"


settings = Settings()
