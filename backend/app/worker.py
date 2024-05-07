import asyncio
import os
import signal
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.init_db import close_db, init_db
from app.scheduler.init_scheduler import scheduler


def shutdown():
    print("shutdown")
    # 关闭定时任务
    scheduler.shutdown(wait=True)
    # 关闭数据库
    loop.run_until_complete(close_db())
    loop.stop()


async def main():
    # 初始化数据库
    await init_db()
    # 初始化定时任务
    scheduler.start()


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown)
    loop.run_until_complete(main())
    loop.run_forever()
    loop.close()
