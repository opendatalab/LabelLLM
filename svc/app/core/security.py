from typing import Annotated

from fastapi import Depends
from fastapi.security import APIKeyCookie

from app.core import exceptions

reusable_token = APIKeyCookie(name="uaa-token", auto_error=False)


def get_current_user_sso_jwt(token: Annotated[str, Depends(reusable_token)]) -> str:
    if not token:
        raise exceptions.TOKEN_INVALID

    return token
