import time
from uuid import UUID

from loguru import logger
from redis.exceptions import LockError

from app import crud, models, schemas
from app.db.session import redis_session
from app.scheduler import scheduler
from app.util import sample

def task_scheduler_job_name(task_id: UUID):
    return f"task_scheduler_job_{task_id}"


# 标注任务定时数据处理
async def label_task_scheduler_job(task_id: UUID):
    try:
        async with redis_session.lock(
            f"label_task_scheduler_job_{task_id}", blocking=False
        ):
            logger.info(f"Start schedulel job for label task {task_id}")

            task = await crud.label_task.query(task_id=task_id).first_or_none()
            if task is None:
                logger.error(f"Label task {task_id} not found")
                scheduler.remove_job(job_id=task_scheduler_job_name(task_id))
                return

            # 清理过期的数据
            records = await crud.record.query(
                task_id=task_id,
                create_time_lt=int(time.time()) - task.expire_time,
                is_submit=False,
            ).to_list()
            for record in records:
                data = await crud.data.query(data_id=record.data_id).first_or_none()
                if data is None:
                    logger.error(f"Data {record.data_id} not found")
                    continue
                await crud.record.remove(_id=record.id)
                await crud.data.update(
                    db_obj=data,
                    obj_in=models.data.DataUpdate(
                        status=schemas.data.DataStatus.PENDING
                    ),
                )

            logger.info(f"Done schedulel job for label task {task_id}")

    except LockError:
        logger.info(f"Skip schedulel job for label task {task_id}")

