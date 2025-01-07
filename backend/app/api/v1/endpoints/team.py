from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions

router = APIRouter(prefix="/team", tags=["team"])


@router.post(
    "/create",
    response_model=schemas.team.Team,
    summary="创建团队",
    description="创建团队",
)
async def create_team(
    req: schemas.team.CreateTeamReq = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.team.Team:
    # 检查用户是否有权限创建任务
    if (
        user.role != schemas.user.UserType.ADMIN
        and user.role != schemas.user.UserType.SUPER_ADMIN
    ):
        raise exceptions.USER_PERMISSION_DENIED

    team = await crud.team.create(
        obj_in=models.team.TeamCreate(
            name=req.name,
            owner=req.owner,
            owner_cellphone=req.owner_cellphone,
        )
    )
    resp = schemas.team.Team.model_validate(team, from_attributes=True)
    return resp


@router.patch(
    "/update",
    response_model=schemas.team.Team,
    summary="更新团队",
    description="更新团队",
)
async def update_team(
    req: schemas.team.UpdateTeamReq = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.team.Team:
    # 检查用户是否有权限
    if (
        user.role != schemas.user.UserType.ADMIN
        and user.role != schemas.user.UserType.SUPER_ADMIN
    ):
        raise exceptions.USER_PERMISSION_DENIED

    # 检查任务是否存在
    team = await crud.team.query(team_id=req.team_id).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    # 更新任务
    team = await crud.team.update(
        db_obj=team,
        obj_in=models.team.TeamUpdate(
            name=req.name,
            owner=req.owner,
            owner_cellphone=req.owner_cellphone,
        ),
    )
    return schemas.team.Team.model_validate(team, from_attributes=True)


@router.post(
    "/list",
    response_model=schemas.team.ListTeamResp,
    summary="获取团队列表",
    description="获取团队列表",
)
async def list_team(
    page_size: int = Body(...),
    page: int = Body(...),
    name: str = Body(None),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.team.ListTeamResp:
    skip = (page - 1) * page_size
    limit = page_size

    teams = await crud.team.query(
        skip=skip,
        limit=limit,
        sort=["-create_time"],
        name=name.strip() if isinstance(name, str) else None,
    ).to_list()
    if not teams:
        return schemas.team.ListTeamResp(list=[], total=0)

    total = await crud.team.query().count()

    resp = schemas.team.ListTeamResp(
        total=total,
        list=[
            schemas.team.Team(
                team_id=team.team_id,
                name=team.name,
                owner=team.owner,
                owner_cellphone=team.owner_cellphone,
                user_count=team.user_count,
                is_default_team=team.team_id == schemas.team.DEFAULT_TEAM_ID,
            )
            for team in teams
        ],
    )
    return resp


@router.post(
    "/delete",
    summary="删除团队",
    description="删除团队",
)
async def delete_team(
    team_id: str = Body(embed=True),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    # 检查用户是否有权限
    if (
        user.role != schemas.user.UserType.ADMIN
        and user.role != schemas.user.UserType.SUPER_ADMIN
    ):
        raise exceptions.USER_PERMISSION_DENIED

    # 检查团队是否存在
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    # 将当前团队的用户加入到默认团队
    default_team = await crud.team.query(
        team_id=schemas.team.DEFAULT_TEAM_ID
    ).first_or_none()

    if not default_team:
        raise exceptions.SERVER_ERROR

    default_users_ids = set([v.user_id for v in (default_team.users or [])])
    default_users = default_team.users or []
    for t_user in team.users:
        if t_user in default_users_ids:
            continue
        default_users.append(
            schemas.team.TeamMember(
                user_id=t_user.user_id, name="", role=schemas.team.TeamMemberRole.USER
            )
        )

    await crud.team.update(
        db_obj=default_team,
        obj_in=models.team.TeamUpdate(
            name=None,
            owner=None,
            owner_cellphone=None,
            users=default_users,
            user_count=len(default_users),
        ),
    )

    # 删除团队
    await crud.team.remove(team.id)


@router.get(
    "/get/{team_id}",
    response_model=schemas.team.Team,
    summary="获取团队",
    description="获取团队",
)
async def get_team(
    team_id: str,
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.team.Team:
    # 检查用户是否有权限创建任务
    if (
        user.role != schemas.user.UserType.ADMIN
        and user.role != schemas.user.UserType.SUPER_ADMIN
    ):
        raise exceptions.USER_PERMISSION_DENIED
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    resp = schemas.team.Team(
        team_id=team.team_id,
        name=team.name,
        owner=team.owner,
        owner_cellphone=team.owner_cellphone,
        user_count=team.user_count,
        is_default_team=team.team_id == schemas.team.DEFAULT_TEAM_ID,
    )
    return resp
