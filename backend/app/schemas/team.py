from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

DEFAULT_TEAM_ID = UUID("00000000-0000-0000-0000-000000000000")


class TeamBase(BaseModel):
    team_id: UUID = Field(description="团队 id")


class TeamWithName(TeamBase):
    name: str = Field(description="团队名称")


class CreateTeamReq(BaseModel):
    """
    创建团队
    """

    name: str = Field(description="团队名称", max_length=50)
    owner: str | None = Field(description="联系人", max_length=20, default=None)
    owner_cellphone: str | None = Field(description="联系人电话", max_length=20, default=None)


class UpdateTeamReq(BaseModel):
    """
    更新团队
    """

    team_id: UUID = Field(description="团队 id")
    name: str | None = Field(description="团队名称", max_length=50, default=None)
    owner: str | None = Field(description="联系人", max_length=20, default=None)
    owner_cellphone: str | None = Field(description="联系人电话", max_length=20, default=None)


class Team(BaseModel):
    """
    团队
    """

    team_id: UUID = Field(description="团队 id")
    name: str = Field(description="团队名称")
    owner: str | None = Field(description="联系人", default=None)
    owner_cellphone: str | None = Field(description="联系人电话", default=None)
    user_count: int = Field(description="成员个数")
    is_default_team: bool | None = Field(description="是否是默认团队", default=None)


class ListTeamResp(BaseModel):
    """
    任务列表响应
    """

    list: list[Team]
    total: int


##
class TeamMemberRole(str, Enum):
    """
    用户类型
    """

    # 超级管理员
    SUPER_ADMIN = "super_admin"
    # 运营
    ADMIN = "admin"
    # 普通用户
    USER = "user"

class TeamMemberAction(str, Enum):
    ADD    = "add"  # 增加新成员
    UPDATE = "update"  # 更新成员信息，目前只能更改成员角色
    REMOVE = "remove"  # 删除成员


class TeamMember(BaseModel):
    user_id: str = Field(description="用户 id", min_length=1)
    name: str = Field(description="用户名称", default='')
    role: TeamMemberRole = Field(description="角色")



class ListTeamMemberResp(BaseModel):
    list: list[TeamMember]
    total: int


##
class InvitationToTeamLink(BaseModel):
    expire_time: datetime = Field(description="有效期")
    link_id: UUID = Field(description="相对邀请链接 href")


class InvitaionDetails(BaseModel):
    is_expired: bool = Field(description="邀请是否超时")
    is_joined: bool = Field(description="是否已经加入")
    team_name: str = Field(description="发送邀请的团队名称")
    team_id: UUID = Field(description="团队 id")

