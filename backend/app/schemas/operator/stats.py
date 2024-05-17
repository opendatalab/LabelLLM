from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field

MESSAGE_QUESTION_FIELD_NAME = "__sys_message_type"


# 更新需求
class ANSWER_SCOPE(StrEnum):
    CONVERSATION = "conversation"
    QUESTION = "question"
    MESSAGE = "message"


class ANSWER_FLITER_KIND(StrEnum):
    WITHOUT_DUPLICATE = "without_duplicate"
    WITH_DUPLICATE = "with_duplicate"


class BOOL_OPERATOR(StrEnum):
    OP_AND = "and"
    OP_OR = "or"


class CHOICE_KIND(StrEnum):
    ENUM = "enum"
    ARRAY = "array"


class ReqStatsLabelTask(BaseModel):
    task_id: UUID = Field(alias="_id")
    scope: ANSWER_SCOPE = Field(description="答案归类")


class StatsLabelTaskChoice(BaseModel):
    label: str = Field(description="选项名称")
    value: str = Field(description="选项在 schema 中的值")
    count: int = Field(description="选项数量")
    total: int = Field(description="题目总数")
    id: str = Field(description="id")


class StatsLabelTaskQuestion(BaseModel):
    label: str = Field(description="问题 label")
    value: str = Field(description="问题 value")
    data: list[StatsLabelTaskChoice] = Field(description="每个选项的数据")
    id: str = Field(description="id")


class RespStatsLabelTask(BaseModel):
    task_id: UUID = Field(alias="_id")
    scope: ANSWER_SCOPE = Field(description="答案归类")
    data: list[StatsLabelTaskQuestion] = Field(description="各个选项的分布")


class StatsLabelTaskProjectModel(BaseModel):
    value: str | None = Field(alias="_id")
    count: int = Field(description="数量统计")


class ExportDataCustomProjectModel(BaseModel):
    id: str | None = Field(description="id", default=None)


class ExportDataProjectModel(BaseModel):
    custom: ExportDataCustomProjectModel | None = Field(
        description="自定义字段", default=None
    )
    data_id: UUID | None = Field(description="data id", default=None)


class ExportStatsLabelTaskIDProjectModel(BaseModel):
    data_id: UUID = Field(description="数据 id")
    questionnaire_id: UUID = Field(description="问卷 id")
    custom_id: list[str] = Field(description="join 查询出的 data 记录", default=[])


class StatsLabelTaskIDProjectModel(BaseModel):
    data: list[ExportStatsLabelTaskIDProjectModel] = Field(description="数据", default=[])

class FilterAnswerOption(BaseModel):
    scope: ANSWER_SCOPE = Field(description="答案归类")
    question: str = Field(description="问题 value 值")
    type: str = Field(description="单选或多选【前端不用传, 由后端填充", default="")
    answer: list[str] = Field(description="选项 value 值")


class ReqFilterAnswer(BaseModel):
    task_id: UUID = Field(alias="_id")
    kind: ANSWER_FLITER_KIND = Field(description="筛选副本类别，单题模式或源题多题对比")
    filters: list[FilterAnswerOption] = Field(description="筛选条件", default=[])
    operator: BOOL_OPERATOR = Field(description="操作符", default=BOOL_OPERATOR.OP_AND)


class RespFilterAnswer(BaseModel):
    count: int = Field(description="符合条件的条目个数")


class DoDataRecord(BaseModel):
    questionnaire_id: UUID = Field(description="问卷 id")
    data_id: UUID = Field(description="数据 id")


class RespFilterAnswerDataID(BaseModel):
    task_id: UUID = Field(alias="_id")
    data: list[DoDataRecord] = Field(default=[])


ReqFilterAnswerDataIDOrQuestionnaireID = ReqFilterAnswer


class DoQuestionnaireRecord(BaseModel):
    questionnaire_id: UUID = Field(description="问卷 id")
    data_id: list[UUID] = Field(description="数据 id")


class RespFilterAnswerQuestionnaireID(BaseModel):
    task_id: UUID = Field(alias="_id")
    data: list[DoQuestionnaireRecord] = Field(default=[])


ExportFilterLabelTaskIDProjectModel = ExportStatsLabelTaskIDProjectModel
