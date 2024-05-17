from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

from .team import TeamMemberRole, TeamMember


class UserType(str, Enum):
    """
    用户类型
    """

    # 管理员
    SUPER_ADMIN = "super_admin"
    # 运营
    ADMIN = "admin"
    # 普通用户
    USER = "user"


class DoUserBase(BaseModel):
    user_id: str = Field(description="用户ID")


class DoUserWithUsername(DoUserBase):
    username: str = Field(description="用户名")


class DoUser(DoUserBase):
    role: UserType = Field(description="用户角色")


class EditUserInfo(BaseModel):
    user_id: str = Field(description="用户ID")
    role: UserType = Field(description="用户角色")


class UserInfo(BaseModel):
    user_id: str = Field(description="用户ID")
    role: UserType = Field(description="用户角色")

    # 用户名称
    name: str = Field(description="用户名称")


class ListUserResp(BaseModel):
    list: list[UserInfo]
    total: int


class UserTeamInfo(BaseModel):
    user_id: str = Field(description="用户ID")
    role: TeamMemberRole = Field(description="用户在团队中的角色")

    # 用户名称
    team_id: UUID = Field(description="团队 id")


class ListUserTeamInfoResp(BaseModel):
    list: list[UserTeamInfo]

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")

class RespMe(DoUser):
    name: str = Field(..., description="用户名")
    teams: list[TeamMember] | None = Field(description="teams that user joined")