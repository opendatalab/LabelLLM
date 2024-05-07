import time
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, Field

from app import schemas


class LabelTask(Document):
    """
    标注任务
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

    # 问卷分发次数
    distribute_count: int

    # 问卷答题限制时间
    expire_time: int

    # 执行团队
    teams: list[UUID]

    class Settings:
        use_revision = True


class LabelTaskCreate(BaseModel):
    """
    标注任务创建
    """

    task_id: UUID = Field(default_factory=uuid4)
    title: str
    description: str
    create_time: int = Field(default_factory=lambda: int(time.time()))
    creator_id: str
    status: schemas.task.TaskStatus = schemas.task.TaskStatus.CREATED
    tool_config: dict
    distribute_count: int
    expire_time: int = 0
    teams: list[UUID] = Field(default_factory=list)


class LabelTaskUpdate(BaseModel):
    """
    标注任务更新
    """

    title: str | None = None
    description: str | None = None
    status: schemas.task.TaskStatus | None = None
    tool_config: dict | None = None
    distribute_count: int | None = None
    expire_time: int | None = None
    teams: list[UUID] | None = None
