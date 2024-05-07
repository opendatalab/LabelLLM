from fastapi import Depends, Request
from loguru._logger import Logger

from app import client, crud, schemas
from app.core import exceptions, security


async def get_logger(
    request: Request,
) -> Logger:
    return request.state.logger


async def get_current_user_id(
    request: Request,
    logger: Logger = Depends(get_logger),
    token: str = Depends(security.get_current_user_sso_jwt),
) -> str:
    if not token:
        raise exceptions.TOKEN_INVALID

    try:
        user_info = await client.sso.sso_client.get_user_info(token)
    except exceptions.AppEx:
        raise
    except Exception as e:
        logger.error(f"get user info failed: {e}")
        raise exceptions.SERVER_ERROR

    request.state.user_id = user_info.sso_uid
    request.state.username = user_info.username
    return user_info.sso_uid


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
) -> schemas.user.DoUser:
    user = await crud.user.query(user_id=user_id).first_or_none()

    return schemas.user.DoUser.parse_obj(user)


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
