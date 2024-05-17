from enum import StrEnum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.data import DoDataForUser
from app.schemas.operator.stats import ANSWER_FLITER_KIND
from app.schemas.record import RecordStatus
from app.schemas.task import (
    DoTaskBase,
    TaskStatus,
)
from app.schemas.team import TeamWithName
from app.schemas.user import DoUserWithUsername


class RecordPosLocateKind(StrEnum):
    NEXT = "next"
    PRE = "prev"
    CURRENT = "current"


# 任务完成情况
class ViewDataCount(BaseModel):
    task_id: UUID = Field(alias="_id")
    completed: int
    total: int


class ViewTaskTimeCount(BaseModel):
    task_id: UUID = Field(alias="_id")
    time: int


# 任务进度
class LabelTaskProgress(BaseModel):
    # 已完成题数
    completed: int = Field(description="已完成题数")
    # 总题数
    total: int = Field(description="总题数")
    # 待标注题数
    pending: int = Field(description="待标注题数")
    # 标注中题数
    labeling: int = Field(description="标注中题数")
    # 标注完成题数
    labeled: int = Field(description="标注完成题数")
    # 标注废弃题数
    discarded: int = Field(description="标注废弃题数")
    # 标注时长
    label_time: int = Field(description="标注时长/秒", default=0)


class ViewTaskProgressCount(LabelTaskProgress):
    task_id: UUID = Field(alias="_id")


class TaskDataTotal(BaseModel):
    # 总题数
    total: int = Field(description="总题数")


class ReqLabelTaskCreate(BaseModel):
    """
    创建标注任务
    """

    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    distribute_count: int = Field(description="分发数量")
    tool_config: dict = Field(description="工具配置")


class ReqLabelTaskUpdate(DoTaskBase):
    """
    更新标注任务
    """

    title: str | None = Field(description="任务标题", default=None)
    description: str | None = Field(description="任务描述", default=None)

    tool_config: dict | None = Field(description="工具配置", default=None)
    expire_time: int | None = Field(description="过期时间/秒", default=None)
    teams: list[UUID] | None = Field(description="执行团队", default=None)

    status: TaskStatus | None = Field(description="任务状态", default=None)


class RespGetLabelTask(DoTaskBase):
    """
    获取标注任务
    """

    title: str = Field(description="任务标题")
    description: str = Field(description="任务描述")
    status: TaskStatus = Field(description="任务状态")
    created_time: int = Field(description="创建时间/秒")
    creator: str = Field(description="创建人")
    distribute_count: int = Field(description="分发数量")
    tool_config: dict = Field(description="工具配置")
    expire_time: int = Field(description="过期时间/秒")
    teams: list[TeamWithName] = Field(description="执行团队")
    progress: LabelTaskProgress = Field(description="任务进度")


class ReqListTask(BaseModel):
    """
    获取任务列表
    """

    title: str | None = Field(description="任务标题", default=None)
    status: TaskStatus | None = Field(description="任务状态", default=None)
    creator_id: str | list[str] | None = Field(description="创建人id", default=None)
    page: int = Field(description="跳过数量", default=1, gt=0)
    page_size: int = Field(description="获取数量", default=10, gte=0)


class ListTaskBase(DoTaskBase):
    title: str = Field(description="任务标题")
    status: TaskStatus = Field(description="任务状态")
    created_time: int = Field(description="创建时间/秒")
    creator: str = Field(description="创建人")


class ListLabelTaskBase(ListTaskBase):
    """
    标注任务任务列表基础信息
    """

    completed_count: int = Field(description="已完成数据量")
    total_count: int = Field(description="总数据量")


class RespListTaskBase(BaseModel):
    list: list
    total: int


class RespListLabelTask(RespListTaskBase):
    """
    标注任务列表响应
    """

    list: list[ListLabelTaskBase]


class ReqPreviewData(DoTaskBase):
    data_id: UUID | None = Field(description="数据id", default=None)
    questionnaire_id: UUID | None = Field(description="数据id", default=None)


class RespPreviewData(DoDataForUser):
    label_user: DoUserWithUsername | None = Field(description="标注员")


class ReqPreviewDataID(DoTaskBase):
    data_id: UUID | None = Field(description="数据id", default=None)
    kind: ANSWER_FLITER_KIND = Field(
        description="是否是源题模式", default=ANSWER_FLITER_KIND.WITHOUT_DUPLICATE
    )
    is_invalid_questionnaire: bool | None = Field(
        description="获取有问题的问卷", default=None
    )
    pos_locate: RecordPosLocateKind = Field(
        description="当前问卷或者是下一份问卷", default=RecordPosLocateKind.CURRENT
    )
    questionnaire_id: UUID | None = Field(description="问卷 ID", default=None)


class RespPreviewDataID(DoTaskBase):
    task_id: UUID = Field(description="任务 ID")
    questionnaire_id: UUID | None = Field(description="问卷 ID", default=None)
    data_id: UUID | None = Field(description="数据 ID", default=None)


class ReqRejectData(DoTaskBase):
    user_id: list[str] = Field(description="用户id")


class ReqQuestionnaireDataIDs(BaseModel):
    task_id: UUID = Field(description="任务 id", default=None)
    questionnaire_id: UUID | None = Field(description="问卷 id", default=None)


class RespQuestionnaireDataIDs(BaseModel):
    data: list[UUID] = Field(description="数据 id")


class ReqGroupRecordByUser(DoTaskBase):
    username: str | None = Field(description="用户名", default=None)
    page: int = Field(description="跳过数量", default=1, gt=0)
    page_size: int = Field(description="获取数量", default=10, gte=0)
    sort: Literal["discarded_asc", "discarded_desc"] | None = Field(
        description="排序字段", default=None
    )


class GroupDataByUser(BaseModel):
    label_user: DoUserWithUsername = Field(description="标注员")
    completed: int = Field(description="答题数")
    discarded: int = Field(description="未达标题数")


class RespGroupRecordByUser(RespListTaskBase):
    list: list[GroupDataByUser]


class ReqPreviewRecord(DoTaskBase):
    user_id: str | None = Field(description="用户id", default=None)
    record_status: RecordStatus | None = Field(description="记录状态", default=None)


class RespPreviewRecord(DoDataForUser):
    label_user: DoUserWithUsername | None = Field(description="标注员")


class ReqRecordList(DoTaskBase):
    status: RecordStatus | None = Field(description="记录状态", default=None)
    user_id: str | None = Field(description="用户id", default=None)
    page: int = Field(description="跳过数量", default=1, gt=0)
    page_size: int = Field(description="获取数量", default=10, gte=0)


class RespRecordList(RespListTaskBase): ...
