import sentry_sdk
from fastapi import FastAPI, HTTPException
from fastapi.exception_handlers import http_exception_handler

from app.api.router import router
from app.core.config import settings
from app.db.init_db import close_db, init_db
from app.logger.logger import init_logger
from app.middleware import middleware
from app.scheduler.init_scheduler import scheduler

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    debug=settings.DEBUG,
    environment=settings.ENVIRONMENT,
    release=settings.APP_VERSION,
    traces_sample_rate=1.0,
) if settings.SENTRY_DSN else None  # type: ignore


app = FastAPI(
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


@app.on_event("startup")
async def startup():
    try:
        # 初始化日志
        init_logger()
        # 初始化数据库
        await init_db()
        # 初始化定时任务
        scheduler.start(paused=True)
    except Exception as e:
        raise e


@app.on_event("shutdown")
async def shutdown():
    # 关闭定时任务
    # scheduler.shutdown()
    # 关闭数据库
    await close_db()


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    if exc.status_code == 500:
        if settings.SENTRY_DSN:
            if hasattr(request.state, "user_id"):
                sentry_sdk.set_user(
                    {"id": request.state.user_id, "username": request.state.username}
                )

            sentry_sdk.capture_exception(exc)
    return await http_exception_handler(request, exc)


app.include_router(router, prefix=settings.API_STR)
middleware.init_middleware(app)
