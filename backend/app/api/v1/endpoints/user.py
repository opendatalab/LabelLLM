
from typing import Optional

from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions

router = APIRouter(prefix="/user", tags=["user"])


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

    db_user = await crud.user.query(user_id=user_info.user_id).first_or_none()
    if not db_user:
        raise exceptions.USER_NOT_EXIST

    if user.role != schemas.user.UserType.SUPER_ADMIN:
        raise exceptions.USER_NOT_ALLOWED_OPERATION

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
    user_name: Optional[str] = Body(""),
    role: schemas.user.UserType | None = Body(default=None),
    page_size: int = Body("page_size", description="分页大小", example=10),
    page: int = Body("page", description="第几页", example=1),
    is_operator: bool = Body(default=False, description="是否是运营"),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    if user.role not in (schemas.user.UserType.SUPER_ADMIN, schemas.user.UserType.ADMIN) :
        raise exceptions.USER_PERMISSION_DENIED

    skip = (page - 1) * page_size
    limit = page_size
    
    if is_operator:
        roles = [schemas.user.UserType.ADMIN, schemas.user.UserType.SUPER_ADMIN]
    else:
        roles = role  # type: ignore 
    query = crud.user.query(skip=skip, limit=limit, name=user_name, role=roles, sort='-update_time')
    total = await query.count()
    if total == 0:
        return schemas.user.ListUserResp(list=[], total=total)

    users = await query.to_list()
    
    return schemas.user.ListUserResp(total=total,
                                     list=[
                                        schemas.user.UserInfo(user_id=t.user_id,
                                                              role=t.role,
                                                              name=t.name,
                                                            )
                                         for t in users
                                     ])


@router.post(
    "/team/list",
    summary="获取用户在所有的团队中的信息",
    description="获取用户在所有团队中的信息",
    response_model=schemas.user.ListUserTeamInfoResp,
)
async def list_user_teams(
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    teams = await crud.team.query(user_id=user.user_id).to_list()

    return schemas.user.ListUserTeamInfoResp(list=[
        schemas.user.UserTeamInfo(user_id=user.user_id, team_id=team.team_id, role=([v.role for v in team.users if v.user_id == user.user_id and v.role is not None] or [schemas.team.TeamMemberRole.USER])[0])
        for team in teams
    ])

