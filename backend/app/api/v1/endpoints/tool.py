import hashlib

import orjson
from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.client.deepl import deepl_client
from app.client.google import GoogleClient
from app.client.oss import oss
from app.core import exceptions
from app.core.config import settings

router = APIRouter(prefix="/tool", tags=["tool"])


@router.post(
    "/translate",
    response_model=schemas.tool.ToolTranslateResponse,
    summary="翻译",
    description="翻译",
)
async def translate(
    req: schemas.tool.ToolTranslateRequest,
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    """
    翻译
    """

    # 计算翻译内容的 SHA256 值
    text_hash = hashlib.sha256(req.text.encode("utf-8")).hexdigest()

    # 查询是否已经翻译过，翻译过的话直接返回
    cache_key = f"translate/{text_hash}_{req.source}_{req.target}"
    if oss.internal_client.object_exists(cache_key):
        file = oss.internal_client.get_object(cache_key)
        data = orjson.loads(file.read())
        if "translated" in data:
            resp = schemas.tool.ToolTranslateResponse(text=data["translated"])
            return resp

    # 翻译
    translated = deepl_client.translate(
        text=req.text,
        source_lang=req.source,
        target_lang=req.target,
    )

    # 保存翻译结果到 OSS
    oss.internal_client.put_object(
        cache_key,
        orjson.dumps({"source": req.text, "translated": translated}),
    )

    resp = schemas.tool.ToolTranslateResponse(text=translated)
    return resp


@router.post(
    "/google_translate",
    response_model=schemas.tool.ToolTranslateResponse,
    summary="谷歌翻译",
    description="谷歌翻译",
)
async def google_translate(
    req: schemas.tool.ToolGoogleTranslateResponse,
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    """
    翻译
    """

    # 计算翻译内容的 SHA256 值
    text_hash = hashlib.sha256(req.text.encode("utf-8")).hexdigest()

    # 查询是否已经翻译过，翻译过的话直接返回
    cache_key = f"google_translate/{text_hash}_{req.source}_{req.target}"
    if oss.internal_client.object_exists(cache_key):
        file = oss.internal_client.get_object(cache_key)
        data = orjson.loads(file.read())

        if "google_translate" in data:
            resp = schemas.tool.ToolTranslateResponse(text=data["translated"])
            return resp
    # 翻译
    translated = await GoogleClient.async_translate_by_proxy(
        text=req.text,
        source_lang=req.source,
        target_lang=req.target,
    )
    # 保存翻译结果到 OSS
    oss.internal_client.put_object(
        cache_key,
        orjson.dumps({"source": req.text, "translated": translated}),
    )

    resp = schemas.tool.ToolTranslateResponse(text=translated)
    return resp