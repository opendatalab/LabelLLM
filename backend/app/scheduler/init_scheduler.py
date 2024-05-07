from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.jobstores.redis import RedisJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings

jobstores = {
    "default": RedisJobStore(
        host=settings.REDIS_DSN.host,
        port=settings.REDIS_DSN.port,
        db=int(settings.REDIS_DSN.path[1:] if settings.REDIS_DSN.path else 0),
        password=settings.REDIS_DSN.password,
    )
}

executors = {"default": AsyncIOExecutor()}

job_defaults = {"coalesce": True, "max_instances": 1}

scheduler = AsyncIOScheduler(
    jobstores=jobstores, executors=executors, job_defaults=job_defaults
)
