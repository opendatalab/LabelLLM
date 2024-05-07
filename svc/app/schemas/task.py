from enum import Enum
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


class ViewAuditTask(BaseModel):
    task_id: UUID
    index: int


class ViewAuditTaskRemain(BaseModel):
    view_id: ViewAuditTask = Field(alias="_id")
    remain: int


class ViewAuditTaskCompleted(BaseModel):
    view_id: ViewAuditTask = Field(alias="_id")
    completed: int


class DoTaskBase(BaseModel):
    """
    任务基础信息
    """

    task_id: UUID = Field(description="任务id")


class DoTask(DoTaskBase):
    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    tool_config: dict = Field(description="工具配置")


class DoTaskWithStatus(DoTask):
    status: TaskStatus = Field(description="任务状态")


class ReqGetAuditTaskData(DoTaskBase):
    """
    获取审核任务数据
    """

    flow_index: int = Field(description="流程索引")


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
    page_size: int = Field(description="获取数量", default=12, gte=0)


class ListTaskBase(DoTaskBase):
    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    status: TaskStatus = Field(description="任务状态")
    remain_count: int = Field(description="剩余题数")
    completed_count: int = Field(description="已完成题数")


class ListAuditTaskBase(ListTaskBase):
    flow_index: int = Field(description="流程索引")


class RespListTask(BaseModel):
    """
    任务列表
    """

    list: list[ListTaskBase]
    total: int


class RespListAuditTask(BaseModel):
    """
    任务列表
    """

    list: list[ListAuditTaskBase]
    total: int


class ReqBatchCreateData(DoTaskBase):
    """
    批量创建数据
    """

    datas: list[DataCreate] = Field(description="数据列表", min_items=1)
