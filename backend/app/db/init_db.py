from beanie import init_beanie

from app import crud, schemas
from app.core.config import settings
from app.db.session import mongo_session, redis_session
from app.models.data import Data
from app.models.file import File
from app.models.label_task import LabelTask
from app.models.record import Record
from app.models.team import Team, TeamCreate
from app.models.team_invitation import TeamInvitationLink
from app.models.user import User
from app.schemas.team import TeamMember, TeamMemberRole


async def init_db():
    await init_beanie(
        database=mongo_session[settings.MongoDB_DB_NAME],
        document_models=[User, LabelTask, Data, Team, TeamInvitationLink, Record, File],  # type: ignore
    )

    # 创建默认团队
    team = await crud.team.query(team_id=schemas.team.DEFAULT_TEAM_ID).first_or_none()
    if not team:
        team = await crud.team.create(
            obj_in=TeamCreate(
                team_id=schemas.team.DEFAULT_TEAM_ID,
                name="默认团队",
                owner="",
                owner_cellphone="",
            )
        )
        users = await crud.user.query().to_list()
        team.users = [
            TeamMember(user_id=user.user_id, name="", role=TeamMemberRole.USER)
            for user in users
        ]
        team.user_count = len(users)
        await team.save()  # type: ignore

    await redis_session.ping()


async def close_db():
    mongo_session.close()
    await redis_session.close()
