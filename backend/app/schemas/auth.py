
from pydantic import BaseModel, Field

from app.schemas.user import DoUser, SSOUserInfo
from app.schemas.team import TeamMember


class ReqLogin(BaseModel):
    code: str = Field(description="SSO Code")


class RespMe(DoUser, SSOUserInfo):
    teams: list[TeamMember] | None = Field(description="teams that user joined")

