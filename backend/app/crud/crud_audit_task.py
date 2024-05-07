import re
from uuid import UUID

from beanie.operators import ElemMatch, In, NotIn, RegEx

from app import schemas
from app.crud.base import CRUDBase
from app.models.audit_task import (
    AuditFlow,
    AuditFlowCreate,
    AuditFlowData,
    AuditFlowDataCreate,
    AuditFlowDataUpdate,
    AuditFlowUpdate,
    AuditTask,
    AuditTaskCreate,
    AuditTaskUpdate,
)


class CRUDAuditTask(CRUDBase[AuditTask, AuditTaskCreate, AuditTaskUpdate]):
    def query(
        self,
        *,
        _id: list[str] | str | None = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        title: str | None = None,
        status: schemas.task.TaskStatus | list[schemas.task.TaskStatus] | None = None,
        task_id: UUID | list[UUID] | None = None,
        target_task_id: UUID | list[UUID] | None = None,
        creator_id: str | list[str] | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if title is not None:
            query = query.find(RegEx(field=self.model.title, pattern=re.escape(title)))  # type: ignore

        if status is not None:
            if isinstance(status, list):
                query = query.find(In(self.model.status, status))
            else:
                query = query.find(self.model.status == status)

        if task_id is not None:
            if isinstance(task_id, list):
                query = query.find(In(self.model.task_id, task_id))
            else:
                query = query.find(self.model.task_id == task_id)

        if target_task_id is not None:
            if isinstance(target_task_id, list):
                query = query.find(In(self.model.target_task_id, target_task_id))
            else:
                query = query.find(self.model.target_task_id == target_task_id)

        if creator_id is not None:
            if isinstance(creator_id, list):
                query = query.find(In(self.model.creator_id, creator_id))
            else:
                query = query.find(self.model.creator_id == creator_id)

        return query


class CRUDAuditFlow(CRUDBase[AuditFlow, AuditFlowCreate, AuditFlowUpdate]):
    def query(
        self,
        *,
        _id: list[str] | str | None = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        task_id: UUID | list[UUID] | None = None,
        team_id: UUID | list[UUID] | None = None,
        index: int | list[int] | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if task_id is not None:
            if isinstance(task_id, list):
                query = query.find(In(self.model.task_id, task_id))
            else:
                query = query.find(self.model.task_id == task_id)

        if team_id is not None:
            if isinstance(team_id, list):
                query = query.find(ElemMatch(self.model.teams, {"$in": team_id}))
            else:
                query = query.find(ElemMatch(self.model.teams, {"$eq": team_id}))

        if index is not None:
            if isinstance(index, list):
                query = query.find(In(self.model.index, index))
            else:
                query = query.find(self.model.index == index)

        return query


class CRUDAuditFlowData(
    CRUDBase[AuditFlowData, AuditFlowDataCreate, AuditFlowDataUpdate]
):
    def query(
        self,
        *,
        _id: list[str] | str | None = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        task_id: UUID | list[UUID] | None = None,
        data_id: UUID | list[UUID] | None = None,
        index: int | list[int] | None = None,
        status: schemas.data.FlowDataStatus
        | list[schemas.data.FlowDataStatus]
        | None = None,
        not_data_id: UUID | list[UUID] | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if task_id is not None:
            if isinstance(task_id, list):
                query = query.find(In(self.model.task_id, task_id))
            else:
                query = query.find(self.model.task_id == task_id)

        if data_id is not None:
            if isinstance(data_id, list):
                query = query.find(In(self.model.data_id, data_id))
            else:
                query = query.find(self.model.data_id == data_id)

        if index is not None:
            if isinstance(index, list):
                query = query.find(In(self.model.index, index))
            else:
                query = query.find(self.model.index == index)

        if status is not None:
            if isinstance(status, list):
                query = query.find(In(self.model.status, status))
            else:
                query = query.find(self.model.status == status)

        if not_data_id is not None:
            if isinstance(not_data_id, list):
                query = query.find(NotIn(self.model.data_id, not_data_id))
            else:
                query = query.find(self.model.data_id != not_data_id)

        return query


audit_task = CRUDAuditTask(AuditTask)

audit_flow = CRUDAuditFlow(AuditFlow)

audit_flow_data = CRUDAuditFlowData(AuditFlowData)
