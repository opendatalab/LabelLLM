import time
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field


## InvitaionLink
class TeamInvitationLink(Document):
    # link id
    link_id: Indexed(UUID, unique=True)  # type: ignore

    # team id
    team_id: UUID

    # 创建时间
    create_time: int
    # 更新时间
    expire_time: int


class TeamInvitationLinkCreate(BaseModel):
    link_id: UUID = Field(default_factory=uuid4)
    team_id: UUID
    create_time: int = Field(default_factory=lambda: int(time.time()))
    expire_time: int = Field(default_factory=lambda: int(time.time()) + 12 * 60 * 60)


class TeamInvitationLinkUpdate(BaseModel):
    ...
