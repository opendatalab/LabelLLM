from fastapi import Depends, Request
from loguru._logger import Logger

from fastapi import Depends
from fastapi.security import APIKeyCookie

from app import crud, schemas
from app.core import exceptions
from app.core.security import verify_access_token

oauth2_scheme = APIKeyCookie(name="access_token")


async def get_logger(
    request: Request,
) -> Logger:
    return request.state.logger


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = verify_access_token(token)
        username = payload.get("sub")
        if username is None:
            raise exceptions.TOKEN_INVALID
        user = await crud.user.query(name=username).first_or_none()
        if user is None:
            raise exceptions.USER_NOT_EXIST
    except Exception as e:
        raise e
    return user


async def get_current_team(
    user: schemas.user.DoUser = Depends(get_current_user),
):
    teams = await crud.team.query(user_id=user.user_id).to_list()

    return teams


# 用户是管理员或运营
async def is_admin_or_operator(
    user: schemas.user.DoUser = Depends(get_current_user),
) -> None:
    if user.role not in [
        schemas.user.UserType.ADMIN,
        schemas.user.UserType.SUPER_ADMIN,
    ]:
        raise exceptions.USER_PERMISSION_DENIED

    return
