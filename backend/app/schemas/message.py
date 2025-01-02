from uuid import UUID
from typing import Literal

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    message_id: UUID = Field(description="消息ID")
    parent_id: UUID | None = Field(description="父消息ID", default=None)
    message_type: Literal["send", "receive"] = Field(description="消息类型")
    content: str = Field(description="消息内容")


class Message(MessageBase):
    user_id: str = Field(description="用户ID", default="")
