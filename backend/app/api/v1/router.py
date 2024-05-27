from fastapi import APIRouter

from .endpoints import (
    file,
    label_task,
    operator,
    team,
    team_invitation,
    team_member,
    user,
)

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(label_task.router)
v1_router.include_router(team.router)
v1_router.include_router(team_invitation.router)
v1_router.include_router(team_member.router)
v1_router.include_router(operator.router)
v1_router.include_router(user.router)
v1_router.include_router(file.router)
