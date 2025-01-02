import time
from typing import Annotated

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app import schemas


class User(Document):
    # 用户id, 目前使用sso的id
    user_id: Annotated[str, Indexed(unique=True)]

    # 用户密码
    password: str

    # 用户角色
    role: schemas.user.UserType

    # 用户名称
    name: str

    # 创建时间
    create_time: int = 0

    # 更新时间
    update_time: int = 0


class UserCreate(BaseModel):
    user_id: str
    name: str
    password: str
    role: schemas.user.UserType = schemas.user.UserType.USER
    create_time: int = Field(default_factory=lambda: int(time.time()))
    update_time: int = Field(default_factory=lambda: int(time.time()))


class UserUpdate(BaseModel):
    name: str | None = Field(default=None)
    role: schemas.user.UserType | None = Field(default=None)
    update_time: int = Field(default_factory=lambda: int(time.time()))
