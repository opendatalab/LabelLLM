from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

from .team import TeamMemberRole


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


class SSOUserInfo(BaseModel):
    """
    用户信息
    """

    sso_uid: str = Field(description="用户sso uid")
    email: str | None = Field(description="电子邮箱")
    phone: str | None = Field(description="手机号码")
    github_account: str | None = Field(description="github账号")
    wechat: str | None = Field(description="用户微信唯一ID")
    wechat_name: str | None = Field(description="用户微信名")
    avatar: str | None = Field(description="用户头像URL")
    username: str | None = Field(description="用户名")
    nickname: str | None = Field(description="用户昵称")


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
