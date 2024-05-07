from uuid import UUID

from app import schemas
from app.schemas.message import MessageBase


def get_audit_review_record() -> schemas.operator.task.RespPreviewRecord:
    return schemas.operator.task.RespPreviewRecord(
        data_id=UUID("00000000-0000-0000-0000-000000000000"),
        prompt="<b>这是伪数据，仅用于预览！</b>",
        conversation=[
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000001"),
                parent_id=None,
                message_type="send",
                content="本数据仅用于预览！",
            ),
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000002"),
                parent_id=UUID("00000000-0000-0000-0000-000000000001"),
                message_type="receive",
                content="本数据仅用于预览！",
            ),
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000011"),
                parent_id=None,
                message_type="send",
                content="本数据仅用于预览！",
            ),
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000012"),
                parent_id=UUID("00000000-0000-0000-0000-000000000011"),
                message_type="receive",
                content="本数据仅用于预览！",
            ),
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000021"),
                parent_id=None,
                message_type="send",
                content="本数据仅用于预览！",
            ),
            MessageBase(
                message_id=UUID("00000000-0000-0000-0000-000000000022"),
                parent_id=UUID("00000000-0000-0000-0000-000000000021"),
                message_type="receive",
                content="本数据仅用于预览！",
            ),
        ],
        evaluation=schemas.evaluation.SingleEvaluation(
            message_evaluation=None,
            conversation_evaluation=None,
            questionnaire_evaluation=None,
            data_evaluation=None,
        ),
        reference_evaluation=None,
        label_user=None,
    )
