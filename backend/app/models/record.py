import time
from uuid import UUID

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app import schemas


# 数据提交记录
class Record(Document):
    # 数据id
    data_id: Indexed(UUID)  # type: ignore

    # 流程索引
    flow_index: int = 1

    # 任务id
    task_id: Indexed(UUID)  # type: ignore

    # 问卷id
    questionnaire_id: UUID

    # 创建人id
    creator_id: Indexed(str)  # type: ignore

    # 创建时间
    create_time: int

    # 提交时间
    submit_time: int | None

    # 评价
    evaluation: schemas.evaluation.Evaluation | None

    # 提交的结果状态
    status: schemas.record.RecordStatus = schemas.record.RecordStatus.COMPLETED

    class Settings:
        use_revision = True


class RecordCreate(BaseModel):
    data_id: UUID
    flow_index: int = 1
    task_id: UUID
    questionnaire_id: UUID
    creator_id: str
    create_time: int = Field(default_factory=lambda: int(time.time()))
    submit_time: int | None = None
    evaluation: schemas.evaluation.Evaluation | None = None
    status: schemas.record.RecordStatus = schemas.record.RecordStatus.PROCESSING


class RecordUpdate(BaseModel):
    submit_time: int | None = None
    evaluation: schemas.evaluation.Evaluation | None = None
    status: schemas.record.RecordStatus | None = None
