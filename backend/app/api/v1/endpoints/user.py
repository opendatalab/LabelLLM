from typing import Optional
from uuid import uuid4
from datetime import timedelta

from app.models.user import User
from fastapi import APIRouter, Body, Depends, Response

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions, security
from app.core.config import settings

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/create", summary="用户注册", response_model=schemas.user.UserInfo)
async def create_user(req: schemas.user.UserLoginRequest, response: Response):
    # if not settings.USERS_OPEN_REGISTRATION:
    #     raise exceptions.REGISTRATION_FORBIDDEN

    user_count = await crud.user.query().count()

    if user_count == 0:
        user_role = schemas.user.UserType.ADMIN
        team_role = schemas.team.TeamMemberRole.ADMIN
    else:
        user_role = schemas.user.UserType.USER
        team_role = schemas.team.TeamMemberRole.USER

    user = await crud.user.query(name=req.username).first_or_none()
    team = await crud.team.query(team_id=schemas.team.DEFAULT_TEAM_ID).first_or_none()

    if user:
        raise exceptions.USERNAME_ALREADY_TAKEN
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    hashed_password = security.get_password_hash(req.password)

    user = await crud.user.create(
        obj_in=models.user.UserCreate(
            user_id=str(uuid4()),
            name=req.username,
            password=hashed_password,
            role=user_role,
        )
    )
    default_team_users = (team.users or []) + [
        schemas.team.TeamMember(
            user_id=user.user_id, name=user.name, role=team_role
        )
    ]
    await crud.team.update(
        db_obj=team,
        obj_in=models.team.TeamUpdate(
            users=default_team_users,
            user_count=len(default_team_users),
        ),
    )

    access_token = security.create_access_token(
        subject=user.name,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # 设置cookie
    response.set_cookie(key="access_token", value=access_token)

    return schemas.user.UserInfo(
        user_id=user.user_id,
        role=user.role,
        name=user.name,
    )


@router.post(
    "/login",
    summary="用户登录",
    response_model=schemas.user.UserInfo,
)
async def login(
    req: schemas.user.UserLoginRequest,
    response: Response,
):
    user = await crud.user.query(name=req.username).first_or_none()

    if not user:
        raise exceptions.USER_NOT_EXIST

    if not security.verify_password(req.password, user.password):
        raise exceptions.TOKEN_INVALID

    access_token = security.create_access_token(
        subject=user.name,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # 设置cookie
    response.set_cookie(key="access_token", value=access_token)

    return schemas.user.UserInfo(
        user_id=user.user_id,
        role=user.role,
        name=user.name,
    )


@router.post(
    "/logout",
    summary="用户登出",
)
async def logout(response: Response):
    response.delete_cookie(key="access_token")


@router.get(
    "/me",
    summary="获取当前用户信息",
    response_model=schemas.user.RespMe,
)
async def get_me(user: User = Depends(deps.get_current_user)):
    teams = await crud.team.query(user_id=user.user_id).to_list()
    team_roles = []
    for team in teams:
        for u in team.users:
            if u.user_id == user.user_id:
                team_roles.append(u)
                break

    return schemas.user.RespMe(
        user_id=user.user_id, teams=team_roles, role=user.role, name=user.name
    )


@router.post(
    "/edit",
    summary="修改用户信息",
    description="修改用户信息",
)
async def edit_user(
    user_info: schemas.user.EditUserInfo = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    """
    if user.user_id == user_info.user_id:
        raise exceptions.USER_NOT_ALLOWED_OPERATION
    """
    if user_info.user_id is None and user_info.name is None:
        raise exceptions.USER_NOT_EXIST
    


    db_user = await crud.user.query(user_id=user_info.user_id, name=user_info.name).first_or_none()
    if not db_user:
        raise exceptions.USER_NOT_EXIST

    if user.role not in (
        schemas.user.UserType.SUPER_ADMIN,
        schemas.user.UserType.ADMIN,
    ):
        raise exceptions.USER_NOT_ALLOWED_OPERATION

    if db_user.role in (
        schemas.user.UserType.SUPER_ADMIN,
        schemas.user.UserType.ADMIN,
    ) and user_info.role in (schemas.user.UserType.SUPER_ADMIN, schemas.user.UserType.ADMIN):
        raise exceptions.USER_IS_OPERATOR_ALREADY_YET

    await crud.user.update(
        db_obj=db_user,
        obj_in=models.user.UserUpdate(
            role=user_info.role,
        ),
    )


@router.post(
    "/list",
    summary="获取用户列表",
    description="获取用户列表",
    response_model=schemas.user.ListUserResp,
)
async def list_users(
    name: Optional[str] = Body(""),
    role: schemas.user.UserType | None = Body(default=None),
    page_size: int = Body("page_size", description="分页大小", example=10),
    page: int = Body("page", description="第几页", example=1),
    is_operator: bool = Body(default=False, description="是否是运营"),
    user: User = Depends(deps.get_current_user),
):
    if user.role not in (
        schemas.user.UserType.SUPER_ADMIN,
        schemas.user.UserType.ADMIN,
    ):
        raise exceptions.USER_PERMISSION_DENIED

    skip = (page - 1) * page_size
    limit = page_size

    if is_operator:
        roles = [schemas.user.UserType.ADMIN, schemas.user.UserType.SUPER_ADMIN]
    else:
        roles = role  # type: ignore
    query = crud.user.query(
        skip=skip, limit=limit, name=name, role=roles, sort="-update_time"
    )
    total = await query.count()
    if total == 0:
        return schemas.user.ListUserResp(list=[], total=total)

    users = await query.to_list()

    return schemas.user.ListUserResp(
        total=total,
        list=[
            schemas.user.UserInfo(
                user_id=t.user_id,
                role=t.role,
                name=t.name,
            )
            for t in users
        ],
    )


@router.post(
    "/team/list",
    summary="获取用户在所有的团队中的信息",
    description="获取用户在所有团队中的信息",
    response_model=schemas.user.ListUserTeamInfoResp,
)
async def list_user_teams(
    user: User = Depends(deps.get_current_user),
):
    teams = await crud.team.query(user_id=user.user_id).to_list()

    return schemas.user.ListUserTeamInfoResp(
        list=[
            schemas.user.UserTeamInfo(
                user_id=user.user_id,
                team_id=team.team_id,
                role=(
                    [
                        v.role
                        for v in team.users
                        if v.user_id == user.user_id and v.role is not None
                    ]
                    or [schemas.team.TeamMemberRole.USER]
                )[0],
            )
            for team in teams
        ]
    )
