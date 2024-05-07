from typing import Literal

from pydantic import BaseModel, Field


class ReqCreateFileUploadUrl(BaseModel):
    """
    创建文件上传链接请求
    """

    type: Literal[
        "image/png",
        "image/jpeg",
        "image/gif",
        "video/mp4",
        "video/quicktime",
        "audio/mpeg",
    ] = Field(..., description="文件类型")
    content_length: int = Field(..., description="文件大小(50M以内)", gt=0, le=52428800)
    suffix: Literal[
        "png",
        "jpg",
        "jpeg",
        "gif",
        "mp4",
        "mov",
        "mp3",
    ] = Field(..., description="文件后缀")


class RespCreateFileUploadUrl(BaseModel):
    """
    创建文件上传链接响应
    """

    put_url: str = Field(..., description="上传链接")
    get_url: str = Field(..., description="下载链接")
