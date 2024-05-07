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


# 审核任务定时数据处理
async def audit_task_scheduler_job(task_id: UUID):
    try:
        async with redis_session.lock(
            f"audit_task_scheduler_job_{task_id}", blocking=False
        ):
            logger.info(f"Start schedulel job for audit task {task_id}")

            task = await crud.audit_task.query(task_id=task_id).first_or_none()
            if task is None:
                logger.error(f"Audit task {task_id} not found")
                scheduler.remove_job(job_id=task_scheduler_job_name(task_id))
                return

            # 清理过期的数据
            flows = await crud.audit_flow.query(task_id=task_id).to_list()
            for flow in flows:
                records = await crud.record.query(
                    task_id=task_id,
                    create_time_lt=int(time.time()) - flow.expire_time,
                    is_submit=False,
                    flow_index=flow.index,
                ).to_list()

                logger.info(f"Found {len(records)} records in flow {flow.index}")

                for record in records:
                    flow_data = await crud.audit_flow_data.query(
                        data_id=record.data_id, index=flow.index, task_id=task_id
                    ).first_or_none()
                    if flow_data is None:
                        logger.error(f"Data {record.data_id} not found")
                        continue
                    await crud.record.remove(_id=record.id)
                    await crud.audit_flow_data.update(
                        db_obj=flow_data,
                        obj_in=models.audit_task.AuditFlowDataUpdate(
                            status=schemas.data.FlowDataStatus.PENDING
                        ),
                    )

            # 创建新的数据
            datas = await crud.data.query(
                task_id=task.target_task_id,
                status=schemas.data.DataStatus.COMPLETED,
                update_time_lt=int(time.time()) - 5,
                update_time_gt=task.target_data_last_time,
            ).to_list()

            flow = await crud.audit_flow.query(task_id=task_id, index=1).first_or_none()
            if flow is None:
                logger.error(f"Audit flow {task_id} not found")
                return

            new_datas = []
            new_flow_datas = []
            ## 最后一条被转移的数据的更新时间
            target_data_last_time = task.target_data_last_time

            sample_idx_s = set(sample(flow.sample_ratio, len(datas)))
            # 如果目前 audit task 没有一条数据。就把第一条数据。加到 sample_idx_s。保证每轮审核流程必须有 1 条数据

            for idx, data in enumerate(datas):
                target_data_last_time = max(target_data_last_time, data.update_time)
                if idx not in sample_idx_s:
                    continue
                new_data = models.data.DataCreate(
                    task_id=task_id,
                    source_data_id=data.data_id,
                    result_id=data.result_id,
                    questionnaire_id=data.questionnaire_id,
                    prompt=data.prompt,
                    conversation=data.conversation,
                    conversation_id=data.conversation_id,
                    reference_evaluation=data.reference_evaluation,
                    evaluation=data.evaluation,
                    custom=data.custom,
                )
                new_datas.append(new_data)
                new_flow_datas.append(
                    models.audit_task.AuditFlowDataCreate(
                        task_id=task_id,
                        data_id=new_data.data_id,
                        index=1,
                        remain_audit_count=flow.max_audit_count,
                        remain_pass_count=flow.pass_audit_count,
                    )
                )

            if len(new_datas) > 0:
                await crud.audit_task.update(
                    db_obj=task,
                    obj_in=models.audit_task.AuditTaskUpdate(
                        target_data_last_time=target_data_last_time
                    ),
                )
                await crud.data.create_many(obj_in=new_datas)
                await crud.audit_flow_data.create_many(obj_in=new_flow_datas)

            # 创建审核打回的数据
            if (
                task.is_data_recreate
                and len(task.recreate_data_ids) != 0
                and task.target_task_id
            ):
                datas = await crud.data.query(
                    data_id=task.recreate_data_ids,
                    task_id=task.task_id,
                ).to_list()

                # 被打回的数据id
                data_ids = []

                new_datas = []
                for data in datas:
                    new_datas.append(
                        models.data.DataCreate(
                            task_id=task.target_task_id,
                            source_data_id=data.data_id,
                            result_id=data.result_id,
                            questionnaire_id=data.questionnaire_id,
                            prompt=data.prompt,
                            conversation=data.conversation,
                            conversation_id=data.conversation_id,
                            reference_evaluation=data.reference_evaluation,
                            custom=data.custom,
                        )
                    )
                    data_ids.append(data.source_data_id)

                if len(new_datas) > 0:
                    await crud.data.query(data_id=data_ids).set(
                        {
                            models.data.Data.status: schemas.data.DataStatus.DISCARDED,
                        }
                    )  # type: ignore
                    await crud.record.query(data_id=data_ids).set(
                        {
                            models.record.Record.status: schemas.data.DataStatus.DISCARDED,
                        }
                    )  # type: ignore
                    await crud.audit_task.update(
                        db_obj=task,
                        obj_in=models.audit_task.AuditTaskUpdate(recreate_data_ids=[]),
                    )
                    await crud.data.create_many(obj_in=new_datas)

            logger.info(f"Done schedulel job for audit task {task_id}")

    except LockError:
        logger.info(f"Skip schedulel job for audit task {task_id}")
