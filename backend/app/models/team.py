import time
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field
from app.schemas.team import TeamMember

class Team(Document):
    # id
    team_id: Indexed(UUID, unique=True)  # type: ignore

    # 名字
    name: str

    # 联系人
    owner: str | None

    # 联系人电话
    owner_cellphone: str | None

    # 创建时间
    create_time: int

    # 更新时间
    update_time: int

    # 用户 id 列表
    users: list[TeamMember] = []

    # 成员个数
    user_count: int


class TeamCreate(BaseModel):
    team_id: UUID = Field(default_factory=uuid4)
    name: str
    owner: str | None
    owner_cellphone: str | None
    create_time: int = Field(default_factory=lambda: int(time.time()))
    update_time: int = Field(default_factory=lambda: int(time.time()))
    users: list[TeamMember] = Field(default_factory=list)
    user_count: int = Field(default=0)


class TeamUpdate(BaseModel):
    name: str | None = None
    owner: str | None = None
    owner_cellphone: str | None = None
    users: list[TeamMember] | None = None
    user_count: int | None = None
    update_time: int = Field(default_factory=lambda: int(time.time()))
