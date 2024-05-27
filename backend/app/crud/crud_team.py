from typing import Any
from uuid import UUID

from beanie.operators import Eq, In, RegEx

from app.crud.base import CRUDBase
from app.models.team import Team, TeamCreate, TeamUpdate


class CRUDTeam(CRUDBase[Team, TeamCreate, TeamUpdate]):
    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        user_id: list[str] | str | None = None,
        team_id: list[UUID] | UUID | None = None,
        name: str | None = None,
    ):
        query = super().query(_id=_id, skip=skip, limit=limit, sort=sort)

        if user_id is not None:
            if isinstance(user_id, list):
                query = query.find(In("users.user_id", user_id))
            else:
                query = query.find(Eq("users.user_id", user_id))
        if team_id is not None:
            if isinstance(team_id, list):
                query = query.find(In(self.model.team_id, team_id))
            else:
                query = query.find(self.model.team_id == team_id)

        if name is not None:
            query = query.find(RegEx(field=self.model.name, pattern=name))  # type: ignore

        return query


team = CRUDTeam(Team)


