import secrets
import warnings
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    # 从环境变量或.env文件中加载配置，忽略空值和额外的值
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )
    # API的版本字符串
    API_V1_STR: str = "/api/v1"
    # 用于加密的密钥
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 访问令牌的过期时间，单位是分钟，这里设置为8天
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # 服务器的域名
    DOMAIN: str = "localhost"
    # 运行环境，可以是"local"（本地）、"staging"（预发布）或"production"（生产）
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    # 计算属性，返回服务器的主机名，如果运行环境是本地，则使用http，否则使用https
    @computed_field  # type: ignore[misc]
    @property
    def server_host(self) -> str:
        if self.ENVIRONMENT == "local":
            return f"http://{self.DOMAIN}"
        return f"https://{self.DOMAIN}"

    # 允许跨域请求的源
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    # 项目名称
    PROJECT_NAME: str
    # Sentry的DSN，用于错误跟踪
    SENTRY_DSN: HttpUrl | None = None
    # Postgres服务器的地址
    POSTGRES_SERVER: str
    # Postgres服务器的端口，缺省值是5432
    POSTGRES_PORT: int = 5432
    # Postgres的用户名
    POSTGRES_USER: str
    # Postgres的密码
    POSTGRES_PASSWORD: str
    # Postgres的数据库名
    POSTGRES_DB: str = ""

    # 计算属性，返回SQLAlchemy的数据库连接字符串
    @computed_field  # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # SMTP服务器的配置
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    # 发件人的邮箱和姓名
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None

    # 如果没有设置发件人的姓名，则使用项目名称作为发件人的姓名
    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    # 重置密码的邮件中的令牌的过期时间，单位是小时，这里设置为48小时
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    # 计算属性，如果SMTP服务器和发件人的邮箱都设置了，则返回True，否则返回False
    @computed_field  # type: ignore[misc]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    # 测试用户的邮箱
    EMAIL_TEST_USER: str = "test@example.com"
    # 第一个超级用户的邮箱和密码
    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_PASSWORD: str
    # 是否允许用户自行注册，缺省值是False
    USERS_OPEN_REGISTRATION: bool = False

    # 检查某个配置项的值是否是默认值，如果是默认值，则发出警告或抛出异常
    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    # 检查SECRET_KEY、POSTGRES_PASSWORD和FIRST_SUPERUSER_PASSWORD这三个配置项的值是否是默认值
    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self

settings = Settings()  # type: ignore