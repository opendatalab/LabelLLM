from typing import Any
from uuid import UUID

from beanie.operators import In

from app.crud.base import CRUDBase
from app.models.record import Record, RecordCreate, RecordUpdate
from app.schemas.record import RecordStatus


class CRUDRecord(CRUDBase[Record, RecordCreate, RecordUpdate]):
    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        data_id: UUID | list[UUID] | None = None,
        task_id: UUID | list[UUID] | None = None,
        flow_index: int | list[int] | None = None,
        user_id: str | list[str] | None = None,
        create_time_gt: int | None = None,
        create_time_lt: int | None = None,
        is_submit: bool | None = None,
        status: RecordStatus | list[RecordStatus] | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if data_id is not None:
            if isinstance(data_id, list):
                query = query.find(In(self.model.data_id, data_id))
            else:
                query = query.find(self.model.data_id == data_id)

        if task_id is not None:
            if isinstance(task_id, list):
                query = query.find(In(self.model.task_id, task_id))
            else:
                query = query.find(self.model.task_id == task_id)

        if flow_index is not None:
            if isinstance(flow_index, list):
                query = query.find(In(self.model.flow_index, flow_index))
            else:
                query = query.find(self.model.flow_index == flow_index)

        if user_id is not None:
            if isinstance(user_id, list):
                query = query.find(In(self.model.creator_id, user_id))
            else:
                query = query.find(self.model.creator_id == user_id)

        if create_time_gt is not None:
            query = query.find(self.model.create_time > create_time_gt)

        if create_time_lt is not None:
            query = query.find(self.model.create_time < create_time_lt)

        if is_submit is not None:
            if is_submit:
                query = query.find(self.model.submit_time != None)
            else:
                query = query.find(self.model.submit_time == None)

        if status is not None:
            if isinstance(status, list):
                query = query.find(In(self.model.status, status))
            else:
                query = query.find(self.model.status == status)

        return query


record = CRUDRecord(Record)
