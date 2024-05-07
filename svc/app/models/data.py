import time
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app import schemas


class Data(Document):
    # 数据id
    data_id: Indexed(UUID, unique=True)  # type: ignore

    # 数据来源id
    source_data_id: UUID | None

    # 结果id
    result_id: UUID

    # 任务id
    task_id: Indexed(UUID)  # type: ignore

    # 数据状态
    status: schemas.data.DataStatus

    # 问卷id
    questionnaire_id: Indexed(UUID)  # type: ignore

    # 提示内容
    prompt: str

    # 对话id
    conversation_id: UUID

    # 对话内容
    conversation: list[schemas.message.Message]

    # 参考评价
    reference_evaluation: schemas.evaluation.LabelEvaluation | None

    # 评价
    evaluation: schemas.evaluation.Evaluation

    # 更新时间
    update_time: int

    # 自定义数据
    custom: dict = Field(default_factory=dict)

    # 是否被抽样过
    sampled: bool | None

    class Settings:
        use_revision = True
    

class DataCreate(BaseModel):
    data_id: UUID = Field(default_factory=uuid4)
    source_data_id: UUID | None = None
    result_id: UUID = Field(default_factory=uuid4)
    task_id: UUID
    status: schemas.data.DataStatus = schemas.data.DataStatus.PENDING
    questionnaire_id: UUID
    prompt: str
    conversation_id: UUID
    conversation: list[schemas.message.Message]
    reference_evaluation: schemas.evaluation.LabelEvaluation | None
    evaluation: schemas.evaluation.Evaluation = Field(
        default_factory=schemas.evaluation.Evaluation
    )
    update_time: int = Field(default_factory=lambda: int(time.time()))
    custom: dict = Field(default_factory=dict)


class DataUpdate(BaseModel):
    status: schemas.data.DataStatus | None = None
    evaluation: schemas.evaluation.Evaluation | None = None
    update_time: int = Field(default_factory=lambda: int(time.time()))