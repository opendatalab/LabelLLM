import time

from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.client.oss import oss
from app.core import exceptions
from app.core.config import settings
from app.db.session import redis_session

router = APIRouter(prefix="/file", tags=["file"])


@router.post(
    "/create",
    summary="创建文件链接",
    description="创建文件链接",
    response_model=schemas.file.RespCreateFileUploadUrl,
)
async def create_file_upload_url(
    req: schemas.file.ReqCreateFileUploadUrl = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.file.RespCreateFileUploadUrl:
    # 限制用户每分钟上传文件数量，每分钟时间段内最多上传60个文件
    await redis_session.zremrangebyscore(
        f"file:upload:limit:{user.user_id}", 0, int(time.time()) - 60
    )
    if await redis_session.zcard(f"file:upload:limit:{user.user_id}") > 60:
        raise exceptions.FILE_UPLOAD_LIMIT

    file = await crud.file.create(
        obj_in=models.file.FileCreate(
            creator_id=user.user_id,
        )
    )

    await redis_session.zadd(
        f"file:upload:limit:{user.user_id}", {file.file_id.hex: int(file.create_time)}
    )

    resp = schemas.file.RespCreateFileUploadUrl(
        put_url=oss.client.sign_url(
            "PUT",
            f"{settings.ENVIRONMENT}/file_upload/{file.file_id}.{req.suffix}",
            86400,
            slash_safe=True,
            headers={"Content-Length": req.content_length, "Content-Type": req.type},
        ),
        get_url=oss.client.sign_url(
            "GET",
            f"{settings.ENVIRONMENT}/file_upload/{file.file_id}.{req.suffix}",
            315360000,
            slash_safe=True,
        ),
    )

    return resp
