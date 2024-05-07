import re
from uuid import UUID

from beanie.operators import ElemMatch, In, RegEx

from app import schemas
from app.crud.base import CRUDBase
from app.models.label_task import LabelTask, LabelTaskCreate, LabelTaskUpdate


class CRUDLabelTask(CRUDBase[LabelTask, LabelTaskCreate, LabelTaskUpdate]):
    def query(
        self,
        *,
        _id: list[str] | str | None = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        title: str | None = None,
        status: schemas.task.TaskStatus | list[schemas.task.TaskStatus] | None = None,
        team_id: UUID | list[UUID] | None = None,
        task_id: UUID | list[UUID] | None = None,
        creator_id: str | list[str] | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if title is not None and len(title.strip()) > 0:
            title = title.strip()
            query = query.find(RegEx(field=self.model.title, pattern=re.escape(title), options="i"))  # type: ignore

        if status is not None:
            if isinstance(status, list):
                query = query.find(In(self.model.status, status))
            else:
                query = query.find(self.model.status == status)

        if team_id is not None:
            if isinstance(team_id, list):
                query = query.find(ElemMatch(self.model.teams, {"$in": team_id}))
            else:
                query = query.find(ElemMatch(self.model.teams, {"$eq": team_id}))

        if task_id is not None:
            if isinstance(task_id, list):
                query = query.find(In(self.model.task_id, task_id))
            else:
                query = query.find(self.model.task_id == task_id)

        if creator_id is not None:
            if isinstance(creator_id, list):
                query = query.find(In(self.model.creator_id, creator_id))
            else:
                query = query.find(self.model.creator_id == creator_id)

        return query


label_task = CRUDLabelTask(LabelTask)
