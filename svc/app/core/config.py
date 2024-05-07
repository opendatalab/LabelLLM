from pydantic import BaseSettings, RedisDsn


class Settings(BaseSettings):
    # Debug Config
    DEBUG: bool = False

    # App Config
    APP_VERSION: str | None = None
    API_STR: str = "/api"
    ENVIRONMENT: str = "dev"

    # MongoDB Config
    MongoDB_DSN: str = "mongodb://root:mypassword@localhost:27017"
    MongoDB_DB_NAME: str = "chat_dev"

    # Redis Config
    REDIS_DSN: RedisDsn = RedisDsn("redis://localhost:6379/0", scheme="redis")  # type: ignore

    # SSO Config
    SSO_HOST: str = ""
    SSO_CLIENT_ID: str = ""
    SSO_SECRET: str = ""

    # Sentry Config
    SENTRY_DSN: str = ""

    # OSS Config
    OSS_ACCESS_KEY_ID: str = ""
    OSS_ACCESS_KEY_SECRET: str = ""
    OSS_ENDPOINT: str = ""
    OSS_INTERNAL_ENDPOINT: str = ""
    OSS_BUCKET: str = ""

    # DeepL Config
    DEEPL_AUTH_KEY: str = ""

    # Google Config
    GOOGLE_AUTH_KEY: str = ""
    GOOGLE_PROXY_URL: str = "http://8.210.75.88:8888/translate"
    GOOGLE_PROXY_AUTH: str = "Q3mBvUXlA27bCxU5vvqs"

    class Config:
        env_file = ".env"


settings = Settings()
