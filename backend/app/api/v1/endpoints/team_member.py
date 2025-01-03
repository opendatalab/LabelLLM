from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions

router = APIRouter(prefix="/team/member", tags=["team_member"])


## team members
@router.post(
    "/list",
    response_model=schemas.team.ListTeamMemberResp,
    summary="获取团队成员列表",
    description="获取团队成员列表",
)
async def list_members(
    team_id: str = Body(...),
    user_name: str | None = Body(default=None),
    role: schemas.team.TeamMemberRole | None = Body(default=None),
    page_size: int = Body("page_size", description="分页大小", example=10),
    page: int = Body("page", description="第几页", example=1),
) -> schemas.team.ListTeamMemberResp:
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST
    skip = (page - 1) * page_size
    limit = page_size

    if len(team.users or []) == 0:
        return schemas.team.ListTeamMemberResp(list=[], total=0)

    if role:
        team_users = [v for v in team.users if v.role == role]
    else:
        team_users = team.users
        
    user_ids = [v.user_id for v in (team_users or [])]

    query = crud.user.query(
        skip=skip, limit=limit, name=user_name, user_id=user_ids
    )
    users = await query.to_list()
    total = await query.count()
    if not users:
        return schemas.team.ListTeamMemberResp(list=[], total=total)
    h = {}
    for v in users:
        h[v.user_id] = v

    h = {}
    for v in users:
        h[v.user_id] = v

    records = []
    for v in reversed(team.users):
        if v.user_id not in h:
            continue
        records.append(schemas.team.TeamMember(user_id=v.user_id, name=h[v.user_id].name, role=v.role))

    return schemas.team.ListTeamMemberResp(
        total=total,
        list=records,
    )


## team invitation
@router.post(
    "/invitations/create",
    summary="创建邀请链接",
    description="创建邀请链接",
    response_model=schemas.team.InvitationToTeamLink,
)
async def create_invidation_link(
    team_id: str = Body(
        "team_id", description="团队 id", example="test-team-id", embed=True
    ),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST
    
    me_role = schemas.team.TeamMemberRole.USER
    for v in team.users:
        if v.user_id == user.user_id:
            me_role = v.role

     # 检查用户是否有权限
    if (
        user.role != schemas.user.UserType.ADMIN
        and user.role != schemas.user.UserType.SUPER_ADMIN and 
        me_role == schemas.team.TeamMemberRole.USER
    ):
        raise exceptions.USER_PERMISSION_DENIED

    record = models.team_invitation.TeamInvitationLinkCreate(team_id=team.team_id)
    link = await crud.team_invitation_link.create(
        obj_in=record,
    )
    resp = schemas.team.InvitationToTeamLink.model_validate(link, from_attributes=True)
    return resp


@router.post(
    "/remove",
    summary="删除用户",
    description="删除用户",
)
async def remove_member(
    team_id: str = Body("team_id", description="团队 id", example="test-team-id"),
    user_id: str = Body("user_id", description="用户 id", example="user-id"),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    # 检查 user 和 team 是否存在
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    if team_id == schemas.team.DEFAULT_TEAM_ID:
        raise exceptions.TEAM_CAN_NOT_KICK_FROM_DEFAULT_TEAM

    # 权限校验
    me_role: None | schemas.team.TeamMemberRole = None
    kicked_user_role: None | schemas.team.TeamMemberRole = None
    
    pre_super_admin_count = 0
    for t_user in team.users:
        if t_user.user_id == user.user_id:
            me_role = t_user.role
        if t_user.user_id == user_id:
            kicked_user_role = t_user.role
        if t_user.role == schemas.team.TeamMemberRole.SUPER_ADMIN:
            pre_super_admin_count += 1
    
    if kicked_user_role is None:
        raise exceptions.TEAM_USER_NOT_JOINED

    if (user.role == schemas.user.UserType.ADMIN or user.role == schemas.user.UserType.SUPER_ADMIN) or ( 
        me_role == schemas.team.TeamMemberRole.SUPER_ADMIN and kicked_user_role != schemas.team.TeamMemberRole.SUPER_ADMIN) or (
        me_role == schemas.team.TeamMemberRole.ADMIN and kicked_user_role == schemas.team.TeamMemberRole.USER):
        pass 
    else:
        raise exceptions.USER_PERMISSION_DENIED

    after_super_admin_count = pre_super_admin_count
    # 准备更新数据
    new_users = []
    found = False
    if team.users:
        for t_user in team.users:
            if user_id == t_user.user_id:
                if t_user.role == schemas.user.UserType.SUPER_ADMIN: after_super_admin_count -= 1
                found = True
                continue
            new_users.append(t_user)

    if not found:
        raise exceptions.TEAM_USER_NOT_JOINED
    
    if pre_super_admin_count > 0 and after_super_admin_count == 0:
        raise exceptions.TEAM_USER_AT_LEAST_HAVE_ONE_SUPER_ADMIN

    # 更新用户信息
    default_team = await crud.team.query(
        team_id=schemas.team.DEFAULT_TEAM_ID
    ).first_or_none()

    if not default_team:
        raise exceptions.SERVER_ERROR

    await crud.team.update(
        db_obj=team,
        obj_in=models.team.TeamUpdate(
            name=None, owner=None, owner_cellphone=None, users=new_users, user_count=len(new_users),
        ),
    )

    default_users_ids = set([v.user_id for v in (default_team.users or [])])
    default_users = (default_team.users or [])
    if user_id not in default_users_ids:
        default_users.append(schemas.team.TeamMember(user_id=user_id, name='', role=schemas.team.TeamMemberRole.USER))

    await crud.team.update(
        db_obj=default_team,
        obj_in=models.team.TeamUpdate(
            name=None, owner=None, owner_cellphone=None, users=default_users, user_count=len(default_users),
        ),
    )


@router.post(
    "/edit",
    summary="更新团队成员信息",
    description="更新团队成员信息",
)
async def edit_team_member(
    team_id: str = Body(
        "team_id", description="团队 id", example="test-team-id"),
    user_info: schemas.team.TeamMember= Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    # 检查用户是否有权限
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    if user_info.role is None:
        raise exceptions.TEAM_USER_ROLE_EMPTY
    
    me_role: None | schemas.team.TeamMemberRole = None
    edited_user_role: None | schemas.team.TeamMemberRole = None
    
    pre_super_admin_count = 0
    for t_user in team.users:
        if t_user.user_id == user.user_id:
            me_role = t_user.role
        if t_user.user_id == user_info.user_id:
            edited_user_role = t_user.role
        if t_user.role == schemas.team.TeamMemberRole.SUPER_ADMIN:
            pre_super_admin_count += 1
    
    if edited_user_role is None:
        raise exceptions.TEAM_USER_NOT_JOINED

    if (user.role == schemas.user.UserType.ADMIN or user.role == schemas.user.UserType.SUPER_ADMIN) or ( 
        me_role == schemas.team.TeamMemberRole.SUPER_ADMIN and user_info.role != schemas.team.TeamMemberRole.SUPER_ADMIN and 
        edited_user_role != schemas.team.TeamMemberRole.SUPER_ADMIN):
        pass 
    else:
        raise exceptions.USER_PERMISSION_DENIED

    team_users = team.users or []

    if edited_user_role is None:
        raise exceptions.TEAM_USER_NOT_JOINED
    
    after_super_admin_count = 0
    for i in range(len(team_users)):
        if team_users[i].user_id == user_info.user_id:
            team_users[i].role = user_info.role
        if team_users[i].role == schemas.team.TeamMemberRole.SUPER_ADMIN:
            after_super_admin_count += 1
    
    # 不可以移除所有的超管
    if pre_super_admin_count > 0 and after_super_admin_count == 0:
        raise exceptions.TEAM_USER_AT_LEAST_HAVE_ONE_SUPER_ADMIN

    await crud.team.update(
        db_obj=team,
        obj_in=models.team.TeamUpdate(
            name=None, owner=None, owner_cellphone=None, users=team_users, user_count=len(team_users),
        ),
    )


