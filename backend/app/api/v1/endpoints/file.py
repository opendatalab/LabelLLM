import time
from datetime import timedelta
from pathlib import Path
from io import BytesIO

import magic
import httpx
from fastapi import APIRouter, Body, Depends, Response, UploadFile, File

from app import crud, models, schemas
from app.api import deps
from app.client.minio import minio
from app.core import exceptions
from app.core.config import settings
from app.db.session import redis_session

router = APIRouter(prefix="/file", tags=["file"])


@router.post(
    "/file_upload",
    summary="上传文件",
    description="上传文件",
)
async def file_upload(
    file: UploadFile,
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    await redis_session.zremrangebyscore(
        f"file:upload:limit:{user.user_id}", 0, int(time.time()) - 60
    )
    if await redis_session.zcard(f"file:upload:limit:{user.user_id}") > 60:
        raise exceptions.FILE_UPLOAD_LIMIT

    db_file = await crud.file.create(
        obj_in=models.file.FileCreate(
            creator_id=user.user_id,
        )
    )

    data = await file.read()

    minio.client.put_object(
        settings.MINIO_BUCKET,
        f"{settings.ENVIRONMENT}/file_upload/{db_file.file_id}{Path(file.filename or '').suffix}",
        BytesIO(data),
        length=len(data),
    )

    return {
        "get_path": f"/api/v1/file/file_preview?path={settings.ENVIRONMENT}/file_upload/{db_file.file_id}{Path(file.filename or '').suffix}",
    }


@router.get(
    "/file_preview",
    summary="获取文件预览",
    description="获取文件预览",
)
async def file_preview(path: str):
    url = minio.client.presigned_get_object(
        settings.MINIO_BUCKET, path, expires=timedelta(days=1)
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
    data = resp.content
    mimetype = magic.from_buffer(data[:1024], mime=True)
    return Response(data, media_type=mimetype)
