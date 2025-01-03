from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.schemas.evaluation import Evaluation, LabelEvaluation, SingleEvaluation
from app.schemas.message import Message, MessageBase


class FlowDataStatus(str, Enum):
    """
    数据状态
    """

    # 待加工
    PENDING = "pending"
    # 加工中
    PROCESSING = "processing"
    # 已完成
    COMPLETED = "completed"


class DataStatus(str, Enum):
    """
    数据状态
    """

    # 待加工
    PENDING = "pending"
    # 加工中
    PROCESSING = "processing"
    # 已完成
    COMPLETED = "completed"
    # 已废弃
    DISCARDED = "discarded"


class DataRange(str, Enum):
    """
    数据范围
    """

    # 全部
    ALL = "all"
    # 未达标
    DISCARDED = "discarded"
    # 已达标
    COMPLETED = "completed"

class DataFormat(str, Enum):
    """
    数据格式
    """

    # 原始数据
    RAW = "raw"
    # 原始数据 + 标注数据
    RAW_LABEL = "raw_label"
    # 原始数据 + 标注数据 + 审核数据
    RAW_LABEL_AUDIT = "raw_label_audit"


class DoDataBase(BaseModel):
    """
    任务基础信息
    """

    questionnaire_id: UUID | None = Field(description="问卷 id", default=None)
    data_id: UUID = Field(description="任务 id")


class DoDataForUser(DoDataBase):
    prompt: str = Field(description="任务提示")
    conversation: list[MessageBase] = Field(description="对话内容")
    evaluation: SingleEvaluation | None = Field(description="任务评价", default=None)
    reference_evaluation: LabelEvaluation | None = Field(
        description="参考评价", default=None
    )


class DataCreate(BaseModel):
    questionnaire_id: UUID = Field(description="问卷 id", default_factory=uuid4)
    prompt: str = Field(description="任务提示")
    conversation_id: UUID = Field(description="对话 id", default_factory=uuid4)
    conversation: list[Message] = Field(description="对话内容")
    reference_evaluation: LabelEvaluation | None = Field(
        description="参考评价", default=None
    )
    custom: dict = Field(description="自定义数据", default_factory=dict)


class DoData(DoDataBase):
    """
    数据信息
    """

    source_data_id: UUID | None
    result_id: UUID
    status: DataStatus
    questionnaire_id: UUID
    prompt: str
    conversation_id: UUID
    conversation: list[Message]
    reference_evaluation: LabelEvaluation | None
    evaluation: Evaluation
    custom: dict = Field(default_factory=dict)


class ReqCommitData(DoDataBase, LabelEvaluation): ...


class RespGetData(DoDataForUser):
    questionnaire_id: UUID = Field(description="问卷 ID")
    remain_time: int = Field(description="剩余时间")


class RespGetAuditData(DoDataBase):
    prompt: str = Field(description="任务提示")
    conversation: list[MessageBase] = Field(description="对话内容")
    evaluation: LabelEvaluation | None = Field(description="任务评价", default=None)
    remain_time: int = Field(description="剩余时间")
