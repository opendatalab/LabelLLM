from uuid import UUID

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    message_id: UUID = Field(description="消息ID")
    parent_id: UUID | None = Field(description="父消息ID", default=None)
    message_type: str = Field(description="消息类型", enum=["send", "receive"])
    content: str = Field(description="消息内容")


class Message(MessageBase):
    user_id: str = Field(description="用户ID", default="")
