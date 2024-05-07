
from fastapi import APIRouter, Body, Depends, Response
from loguru._logger import Logger

from app import crud, models, schemas
from app.api import deps
from app.client.sso import sso_client
from app.core import exceptions, security

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/token",
    summary="用户登录",
    description="用于获取用户的 access token",
)
async def login_for_access_token(
    req: schemas.auth.ReqLogin = Body(...),
    logger: Logger = Depends(deps.get_logger),
) -> Response:
    try:
        jwt = await sso_client.get_jwt(req.code)
    except exceptions.AppEx:
        raise
    except Exception as e:
        logger.error(f"get jwt failed: {e}")
        raise exceptions.SERVER_ERROR

    response = Response()
    response.set_cookie("uaa-token", jwt.jwt, httponly=True)
    return response


@router.post(
    "/logout",
    summary="用户登出",
    description="用于用户登出",
)
async def logout(
    sso_jwt: str = Depends(security.get_current_user_sso_jwt),
    logger: Logger = Depends(deps.get_logger),
) -> Response:
    try:
        await sso_client.logout(sso_jwt)
    except exceptions.AppEx:
        raise
    except Exception as e:
        logger.error(f"logout failed: {e}")
        raise exceptions.SERVER_ERROR

    response = Response()
    response.set_cookie("uaa-token", "", httponly=True, expires=0)
    return response


@router.post(
    "/me",
    response_model=schemas.auth.RespMe,
    summary="获取用户信息",
    description="用于获取用户的信息",
)
async def me(
    sso_jwt: str = Depends(security.get_current_user_sso_jwt),
    logger: Logger = Depends(deps.get_logger),
) -> schemas.auth.RespMe:
    try:
        user_info = await sso_client.get_user_info(sso_jwt)
    except exceptions.AppEx:
        raise
    except Exception as e:
        logger.error(f"get user info failed: {e}")
        raise exceptions.SERVER_ERROR

    # 获取用户
    user = await crud.user.query(user_id=user_info.sso_uid).first_or_none()
    if not user:
        user = await crud.user.create(
            obj_in=models.user.UserCreate(
                user_id=user_info.sso_uid,
                name=user_info.username if user_info.username else user_info.sso_uid,
            )
        )
        default_team = await crud.team.query(
            team_id=schemas.team.DEFAULT_TEAM_ID
        ).first_or_none()
        if not default_team:
            raise exceptions.SERVER_ERROR
        default_team_users = (default_team.users or []) + [schemas.team.TeamMember(user_id=user.user_id, name="", role=schemas.team.TeamMemberRole.USER)]
        await crud.team.update(
            db_obj=default_team,
            obj_in=models.team.TeamUpdate(
                users=default_team_users, user_count=len(default_team_users),
            ),
        )
    if user_info:
        await crud.user.update(
            db_obj=user,
            obj_in=models.user.UserUpdate(
                update_time=user.update_time,
                name=user_info.username if user_info.username else user_info.sso_uid,
            ),
        )

    teams = await crud.team.query(user_id=user.user_id).to_list()
    team_roles = []
    for team in teams:
        for u in team.users:
            if u.user_id == user_info.sso_uid:
                team_roles.append(u)
                break

    return schemas.auth.RespMe(
        user_id=user_info.sso_uid, teams=team_roles, role=user.role, **user_info.dict()
    )

