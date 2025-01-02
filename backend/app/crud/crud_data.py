from typing import Any
from uuid import UUID

from beanie.operators import In, NotIn

from app import schemas
from app.crud.base import CRUDBase
from app.models.data import Data, DataCreate, DataUpdate


class CRUDData(CRUDBase[Data, DataCreate, DataUpdate]):
    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        data_id: UUID | list[UUID] | None = None,
        status: schemas.data.DataStatus | list[schemas.data.DataStatus] | None = None,
        task_id: UUID | list[UUID] | None = None,
        questionnaire_id: UUID | list[UUID] | None = None,
        not_questionnaire_id: UUID | list[UUID] | None = None,
        update_time_lt: int | None = None,
        update_time_gt: int | None = None,
        source_data_id: UUID | list[UUID] | None = None,
        is_reject: bool | None = None,
        invalid: bool | None = None,
    ):
        query = super().query(_id=_id, skip=skip, limit=limit, sort=sort)

        if data_id is not None:
            if isinstance(data_id, list):
                query = query.find(In(self.model.data_id, data_id))
            else:
                query = query.find(self.model.data_id == data_id)

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

        if questionnaire_id is not None:
            if isinstance(questionnaire_id, list):
                query = query.find(In(self.model.questionnaire_id, questionnaire_id))
            else:
                query = query.find(self.model.questionnaire_id == questionnaire_id)

        if not_questionnaire_id is not None:
            if isinstance(not_questionnaire_id, list):
                query = query.find(
                    NotIn(self.model.questionnaire_id, not_questionnaire_id)
                )
            else:
                query = query.find(self.model.questionnaire_id != not_questionnaire_id)

        if update_time_lt is not None:
            query = query.find(self.model.update_time < update_time_lt)

        if update_time_gt is not None:
            query = query.find(self.model.update_time > update_time_gt)

        if source_data_id is not None:
            if isinstance(source_data_id, list):
                query = query.find(In(self.model.source_data_id, source_data_id))
            else:
                query = query.find(self.model.source_data_id == source_data_id)

        if is_reject is not None:
            if is_reject:
                query = query.find(self.model.source_data_id != None)
            else:
                query = query.find(self.model.source_data_id == None)

        if invalid is not None:
            if invalid:
                query = query.find(
                    {
                        "evaluation.questionnaire_evaluation.is_invalid_questionnaire": True
                    }
                )
            else:
                query = query.find(
                    {
                        "evaluation.questionnaire_evaluation.is_invalid_questionnaire": False
                    }
                )

        return query


data = CRUDData(Data)
