import time
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app import schemas


class AuditTask(Document):
    """
    审核任务
    """

    # 任务id
    task_id: Indexed(UUID, unique=True)  # type: ignore

    # 任务标题
    title: str
    # 任务描述
    description: str

    # 创建时间
    create_time: int
    # 创建人ID
    creator_id: str

    # 任务状态
    status: schemas.task.TaskStatus

    # 工具配置
    tool_config: dict

    # 被审核的任务id
    target_task_id: UUID | None

    # 在被审核任务中，最后一条被本任务处理的数据的更新时间
    target_data_last_time: int

    # 在本任务中未通过的数据是否需要在被审核的任务中创建新的数据
    is_data_recreate: bool

    # 待重建的数据id
    recreate_data_ids: list[UUID]

    class Settings:
        use_revision = True


class AuditTaskCreate(BaseModel):
    """
    审核任务创建
    """

    task_id: UUID = Field(default_factory=uuid4)
    title: str
    description: str
    create_time: int = Field(default_factory=lambda: int(time.time()))
    creator_id: str
    status: schemas.task.TaskStatus = schemas.task.TaskStatus.CREATED
    tool_config: dict
    target_task_id: UUID | None = None
    target_data_last_time: int = 0
    is_data_recreate: bool = False
    recreate_data_ids: list[UUID] = []


class AuditTaskUpdate(BaseModel):
    """
    审核任务更新
    """

    title: str | None = None
    description: str | None = None
    status: schemas.task.TaskStatus | None = None
    tool_config: dict | None = None
    target_task_id: UUID | None = None
    target_data_last_time: int | None = None
    is_data_recreate: bool | None = None
    recreate_data_ids: list[UUID] | None = None


class AuditFlow(Document):
    # 任务id
    task_id: UUID

    # 审核流程索引
    index: int

    # 创建时间
    create_time: int

    sample_ratio: int | None 
    # 最多可审核次数
    max_audit_count: int

    # 达标所需审核次数
    pass_audit_count: int

    # 问卷答题限制时间
    expire_time: int

    # 执行团队
    teams: list[UUID]

    # 是否是最后一个审核流程
    is_last: bool


class AuditFlowCreate(BaseModel):
    task_id: UUID
    index: int
    create_time: int = Field(default_factory=lambda: int(time.time()))
    max_audit_count: int
    sample_ratio: int
    pass_audit_count: int
    expire_time: int
    teams: list[UUID]
    is_last: bool = False


class AuditFlowUpdate(BaseModel):
    teams: list[UUID] | None = None


class AuditFlowData(Document):
    # 任务id
    task_id: Indexed(UUID)  # type: ignore

    # 审核流程索引
    index: int

    # 数据id
    data_id: Indexed(UUID)  # type: ignore

    # 剩余审核次数
    remain_audit_count: int

    # 剩余通过次数
    remain_pass_count: int

    # 认为通过的审核人id
    pass_audit_user_ids: list[str]

    # 认为不通过的审核人id
    reject_audit_user_ids: list[str]

    # 流程状态
    status: schemas.data.FlowDataStatus


class AuditFlowDataCreate(BaseModel):
    task_id: UUID
    index: int
    data_id: UUID
    remain_audit_count: int
    remain_pass_count: int
    pass_audit_user_ids: list[str] = []
    reject_audit_user_ids: list[str] = []
    status: schemas.data.FlowDataStatus = schemas.data.FlowDataStatus.PENDING


class AuditFlowDataUpdate(BaseModel):
    remain_audit_count: int | None = None
    remain_pass_count: int | None = None
    pass_audit_user_ids: list[str] | None = None
    reject_audit_user_ids: list[str] | None = None
    status: schemas.data.FlowDataStatus | None = None
