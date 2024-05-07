import base64
import time

import rsa
from httpx import AsyncClient
from pydantic import BaseModel, Field

from app import schemas
from app.core import exceptions
from app.core.config import settings


class UserInfo(BaseModel):
    sso_uid: str = Field(alias="ssoUid")
    email: str | None
    phone: str | None
    github_account: str | None = Field(alias="githubAccount")
    wechat: str | None
    wechat_name: str | None = Field(alias="wechatName")
    avatar: str | None
    username: str | None
    nickname: str | None


class SSO:
    def __init__(
        self, client: AsyncClient, url: str, client_id: str, secret: str
    ) -> None:
        self.client = client
        self.url = url
        self.client_id = client_id
        self.secret = secret

    async def get_public_key(self) -> rsa.PublicKey:
        resp = await self.client.post(
            f"{self.url}/api/v1/cipher/getPubKey",
            json={"clientId": self.client_id, "type": "auth", "from": "platform"},
        )
        resp.raise_for_status()
        pub_key = resp.json()["data"]["pubKey"]
        public_key = (
            f"-----BEGIN PUBLIC KEY-----\n{pub_key}\n-----END PUBLIC KEY-----".encode()
        )
        return rsa.PublicKey.load_pkcs1_openssl_pem(public_key)

    async def get_decrypted(self) -> str:
        public_key = await self.get_public_key()
        return base64.b64encode(
            rsa.encrypt(
                f"{self.client_id}||{self.secret}||{int(time.time())}".encode(),
                public_key,
            )
        ).decode()

    async def get_jwt(self, code: str) -> schemas.sso.ClientRespJwt:
        resp = await self.client.post(
            f"{self.url}/api/v1/internal/getJwt",
            json={
                "code": code,
                "clientId": self.client_id,
                "d": await self.get_decrypted(),
            },
        )
        if resp.json()["msgCode"] != "10000":
            raise exceptions.TOKEN_INVALID
        resp.raise_for_status()

        return schemas.sso.ClientRespJwt.parse_obj(resp.json()["data"])

    async def get_user_info(self, jwt: str) -> schemas.user.SSOUserInfo:
        resp = await self.client.post(
            f"{self.url}/api/v1/internal/getUserInfo",
            json={
                "token": jwt,
                "clientId": self.client_id,
                "d": await self.get_decrypted(),
            },
        )
        if resp.json()["msgCode"] != "10000":
            raise exceptions.TOKEN_INVALID
        resp.raise_for_status()
        return schemas.user.SSOUserInfo.parse_obj(UserInfo.parse_obj(resp.json()["data"]))

    async def logout(self, jwt: str) -> None:
        resp = await self.client.post(
            f"{self.url}/api/v1/logout/all",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        if resp.json()["msgCode"] != "10000":
            raise exceptions.TOKEN_INVALID
        resp.raise_for_status()


client = AsyncClient()

sso_client = SSO(client, settings.SSO_HOST, settings.SSO_CLIENT_ID, settings.SSO_SECRET)
