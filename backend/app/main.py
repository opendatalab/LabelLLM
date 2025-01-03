import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import router
from app.core.config import settings
from app.db.init_db import close_db, init_db
from app.logger.logger import init_logger
from app.scheduler.init_scheduler import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # 初始化日志
        init_logger()
        # 初始化数据库
        await init_db()
        # 初始化定时任务
        scheduler.start()
    except Exception as e:
        raise e
    yield
    # 关闭定时任务
    scheduler.shutdown()
    # 关闭数据库
    await close_db()


app = FastAPI(
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
)


app.include_router(router, prefix=settings.API_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
