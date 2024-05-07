from typing import Any
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.team_invitation import (
    TeamInvitationLink,
    TeamInvitationLinkCreate,
    TeamInvitationLinkUpdate,
)


class CRUDTeamInvitationLink(
    CRUDBase[TeamInvitationLink, TeamInvitationLinkCreate, TeamInvitationLinkUpdate]
):
    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        link_id: UUID | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if link_id is not None:
            query = query.find(self.model.link_id == link_id)

        return query


team_invitation_link = CRUDTeamInvitationLink(TeamInvitationLink)
