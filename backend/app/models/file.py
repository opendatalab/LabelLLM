import time
from uuid import UUID, uuid4

from beanie import Document
from pydantic import BaseModel, Field


class File(Document):
    file_id: UUID
    creator_id: str
    create_time: int


class FileCreate(BaseModel):
    file_id: UUID = Field(default_factory=uuid4)
    creator_id: str
    create_time: int = Field(default_factory=lambda: int(time.time()))


class FileUpdate(BaseModel):
    pass
