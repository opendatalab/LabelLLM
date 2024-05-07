from pydantic import BaseModel, Field


class ClientRespJwt(BaseModel):
    """
    SSO Client JWT Response
    """

    # 用户ID
    sso_uid: str = Field(alias="ssoUid")
    # 用户密钥
    jwt: str
    # 过期时间
    expiration: str
