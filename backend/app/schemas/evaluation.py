from pydantic import BaseModel, Field


class QuestionnaireEvaluation(BaseModel):
    is_invalid_questionnaire: bool = Field(description="是否为无效问卷", default=False)


class LabelEvaluation(BaseModel):
    # 针对单条消息的评价
    message_evaluation: dict | None = Field(
        description="针对单条消息的评价", default=None
    )

    # 针对整个对话的评价
    conversation_evaluation: dict | None = Field(
        description="针对整个对话的评价", default=None
    )

    # 针对整个问卷的评价
    questionnaire_evaluation: QuestionnaireEvaluation | None = Field(
        description="针对整个问卷的评价", default=None
    )


class AuditEvaluation(BaseModel):
    # 针对本条数据的评价
    data_evaluation: list[dict] | None = Field(
        description="针对本条数据的评价", default=None
    )


class SingleEvaluation(LabelEvaluation):
    data_evaluation: dict | None = Field(description="针对本条数据的评价", default=None)


class Evaluation(LabelEvaluation, AuditEvaluation):
    
    def to_label_evaluation(self) -> LabelEvaluation:
        return LabelEvaluation(
            message_evaluation=self.message_evaluation,
            conversation_evaluation=self.conversation_evaluation,
            questionnaire_evaluation=self.questionnaire_evaluation,
        )
