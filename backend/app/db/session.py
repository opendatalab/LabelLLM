from motor import motor_asyncio
from redis.asyncio import Redis

from app.core.config import settings

# mongo session
mongo_session = motor_asyncio.AsyncIOMotorClient(settings.MongoDB_DSN)

# redis session
redis_session = Redis.from_url(str(settings.REDIS_DSN))

