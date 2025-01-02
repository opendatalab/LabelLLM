from enum import Enum, StrEnum
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.data import DataCreate


class TaskStatus(str, Enum):
    """
    任务状态
    """

    # 任务已创建
    CREATED = "created"
    # 任务已发布
    OPEN = "open"
    # 任务已结束
    DONE = "done"

class PreviewDataKind(StrEnum):
    # 入口类型
    USER = "user"
    SUPPLIER = "supplier"
    OPERATOR = "operator"


class ViewQuestionnaireID(BaseModel):
    questionnaire_id: UUID


class ViewDataID(BaseModel):
    data_id: UUID


class ViewTaskCompleted(BaseModel):
    task_id: UUID = Field(alias="_id")
    completed: int


class ViewTaskRemain(BaseModel):
    task_id: UUID = Field(alias="_id")
    remain: int


class DoTaskBase(BaseModel):
    """
    任务基础信息
    """

    task_id: UUID = Field(description="任务id")


class DoTaskKindBase(DoTaskBase):
    """
    任务基础信息
    """

    inlet: PreviewDataKind = Field(description="入口类型")

class DoTask(DoTaskBase):
    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    tool_config: dict = Field(description="工具配置")


class DoTaskWithStatus(DoTask):
    status: TaskStatus = Field(description="任务状态")


class RespGetLabelTask(DoTaskBase):
    """
    获取标注任务
    """

    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    label_tool_config: dict = Field(description="工具配置")


class RespGetAuditTask(DoTaskBase):
    """
    获取标注任务
    """

    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    audit_tool_config: dict = Field(description="工具配置")
    label_tool_config: dict = Field(description="父任务工具配置")


class ReqListTask(BaseModel):
    """
    获取任务列表
    """

    page: int = Field(description="跳过数量", default=1, gt=0)
    page_size: int = Field(description="获取数量", default=12, gt=0)


class ListTaskBase(DoTaskBase):
    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    status: TaskStatus = Field(description="任务状态")
    remain_count: int = Field(description="剩余题数")
    completed_count: int = Field(description="已完成题数")


class RespListTask(BaseModel):
    """
    任务列表
    """

    list: list[ListTaskBase]
    total: int


class ReqBatchCreateData(DoTaskBase):
    """
    批量创建数据
    """

    datas: list[DataCreate] = Field(description="数据列表", min_length=1)

class RespCopyTask(BaseModel):
    is_ok: bool = Field(description="是否成功")
    task_id: UUID | None = Field(description="任务id", default=None)
    msg: str | None = Field(description="错误信息", default=None)
