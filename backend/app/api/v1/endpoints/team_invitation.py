import time
from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions

router = APIRouter(prefix="/user", tags=["user"])


@router.get(
    "/team/invitations/{link_id}",
    summary="邀请链接详情",
    description="邀请链接详情",
    response_model=schemas.team.InvitaionDetails,
)
async def invitation_link(
    link_id: str,
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.team.InvitaionDetails:
    link = await crud.team_invitation_link.query(link_id=UUID(link_id)).first_or_none()
    if not link:
        raise exceptions.TEAM_INVITATION_NOT_EXISTS

    team = await crud.team.query(team_id=link.team_id).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    found = False
    if team.users:
        for v in team.users:
            if v.user_id == user.user_id:
                found = True

    return schemas.team.InvitaionDetails(
        is_expired=int(time.time()) > link.expire_time,
        is_joined=found,
        team_name=team.name,
        team_id=link.team_id,
    )


@router.post(
    "/invitations/join",
    summary="加入团队",
    description="加入团队",
)
async def join_team(
    team_id: str = Body(
        "team_id", description="团队 id", example="test-team-id", embed=True
    ),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    team = await crud.team.query(team_id=UUID(team_id)).first_or_none()
    if not team:
        raise exceptions.TEAM_NOT_EXIST

    # 准备更新数据
    new_users = []
    found = False
    if team.users:
        for t_user in team.users:
            if user.user_id == t_user.user_id:
                found = True
            new_users.append(t_user)

    if found:
        raise exceptions.TEAM_USER_ALREADY_JOINED

    # remove from old team
    old_team = await crud.team.query(user_id=[user.user_id]).first_or_none()
    if not old_team:
        raise exceptions.TEAM_NOT_EXIST
  
    old_users = []
    for t_user in old_team.users:
        if t_user.user_id == user.user_id:
            continue
        old_users.append(t_user)

    # update old team members
    await crud.team.update(
        db_obj=old_team,
        obj_in=models.team.TeamUpdate(
            name=None, owner=None, owner_cellphone=None, users=old_users, user_count=len(old_users),
        ),
    )

    # 更新用户信息
    new_users.append(schemas.team.TeamMember(user_id=user.user_id, name='', role=schemas.team.TeamMemberRole.USER))

    # update team members
    await crud.team.update(
        db_obj=team,
        obj_in=models.team.TeamUpdate(
            name=None, owner=None, owner_cellphone=None, users=new_users, user_count=len(new_users),
        ),
    )

