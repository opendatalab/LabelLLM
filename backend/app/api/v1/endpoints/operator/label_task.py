import random
import tempfile
import zipfile
import io
import urllib.parse
from operator import itemgetter
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from uuid import UUID

import orjson
from beanie.operators import PullAll
from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import Response, StreamingResponse
from loguru._logger import Logger
from openpyxl import Workbook
from pydantic import BaseModel, Field
from redis.exceptions import LockError

from app import crud, models, schemas
from app.api import deps
from app.client import minio
from app.core import exceptions
from app.core.config import settings
from app.db.session import redis_session
from app.scheduler import scheduler
from app.scheduler.task import label_task_scheduler_job, task_scheduler_job_name

router = APIRouter(prefix="/task/label")


@router.post(
    "/create",
    summary="创建标注任务",
    description="创建标注任务",
    response_model=schemas.task.DoTaskBase,
)
async def create_label_task(
    req: schemas.operator.task.ReqLabelTaskCreate = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.task.DoTaskBase:
    task = await crud.label_task.create(
        obj_in=models.label_task.LabelTaskCreate(
            title=req.title,
            description=req.description,
            creator_id=user.user_id,
            tool_config=req.tool_config,
            distribute_count=req.distribute_count,
            teams=req.teams,
            expire_time=req.expire_time,
        )
    )

    resp = schemas.task.DoTaskBase(task_id=task.task_id)

    return resp


@router.post(
    "/derive",
    summary="派生标注任务",
    description="派生标注任务",
    response_model=schemas.operator.task.RespLabelTaskCreateWithData,
)
async def derive_label_task(
    req: schemas.operator.task.ReqLabelTaskCreateWithData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    def remove_duplicates(dict_list, key):
        seen = set()
        new_list = []
        for d in dict_list:
            k = getattr(d, key)
            if k not in seen:
                seen.add(k)
                new_list.append(d)
        return new_list

    def filter_data_by_status(data_list, status: list[schemas.data.DataStatus]):
        return [data for data in data_list if data.status in status]

    res = []
    tasks: list[list[models.data.Data]] = []

    for data in req.data:
        if data.data_ids:
            datas = await crud.data.query(data_id=data.data_ids).to_list()
        else:
            if data.user_id:
                records = await crud.record.query(
                    task_id=data.task_id, user_id=data.user_id
                ).to_list()
                datas = await crud.data.query(
                    task_id=data.task_id, data_id=[record.data_id for record in records]
                ).to_list()
            else:
                datas = await crud.data.query(task_id=data.task_id).to_list()
        if data.data_duplicated:
            datas = remove_duplicates(datas, "questionnaire_id")
        if data.data_status == schemas.data.DataRange.DISCARDED:
            datas = filter_data_by_status(datas, [schemas.data.DataStatus.DISCARDED])
        elif data.data_status == schemas.data.DataRange.COMPLETED:
            datas = filter_data_by_status(datas, [schemas.data.DataStatus.COMPLETED])
        else:
            datas = filter_data_by_status(
                datas,
                [
                    # schemas.data.DataStatus.PENDING,
                    # schemas.data.DataStatus.PROCESSING,
                    schemas.data.DataStatus.COMPLETED,
                    schemas.data.DataStatus.DISCARDED,
                ],
            )
        if len(datas) == 0:
            res.append(
                schemas.operator.task.RespLabelTaskCreateWithDataBase(
                    is_ok=False, msg="前筛选结果对应题数为0, 无法创建任务! 请修改"
                )
            )
        else:
            res.append(
                schemas.operator.task.RespLabelTaskCreateWithDataBase(is_ok=True)
            )
        tasks.append(datas)

    if not all([r.is_ok for r in res]):
        return schemas.operator.task.RespLabelTaskCreateWithData(
            data=res,
        )

    for item, datas in zip(req.data, tasks):
        task = await crud.label_task.query(task_id=item.task_id).first_or_none()
        if not task:
            raise exceptions.TASK_NOT_EXIST

        new_task = await crud.label_task.create(
            obj_in=models.label_task.LabelTaskCreate(
                title=item.title,
                description=task.description,
                creator_id=user.user_id,
                tool_config=task.tool_config,
                distribute_count=item.distribute_count,
                teams=task.teams,
                expire_time=item.expire_time,
            )
        )
        new_datas = [
            models.data.DataCreate(
                task_id=new_task.task_id,
                questionnaire_id=data.questionnaire_id,
                prompt=data.prompt
                if item.data_format == schemas.data.DataFormat.RAW_LABEL_AUDIT
                else data.prompt,
                conversation_id=data.conversation_id,
                conversation=data.conversation,
                reference_evaluation=data.reference_evaluation
                if item.data_format == schemas.data.DataFormat.RAW
                else data.evaluation.to_label_evaluation(),
                custom=data.custom,
            )
            for data in datas
        ]

        await crud.data.create_many(obj_in=new_datas)
        await update_label_task(
            req=schemas.operator.task.ReqLabelTaskUpdate(
                task_id=new_task.task_id,
                status=schemas.task.TaskStatus.OPEN,
            )
        )
    return schemas.operator.task.RespLabelTaskCreateWithData(
        data=res,
    )


@router.post(
    "/copy",
    summary="复制标注任务",
    description="复制标注任务",
    response_model=schemas.task.RespCopyTask,
)
async def copy_label_task(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.task.RespCopyTask:
    copy_task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not copy_task:
        return schemas.task.RespCopyTask(is_ok=False, msg="任务不存在")
    # 创建任务
    try:
        task_resp = await create_label_task(
            req=schemas.operator.task.ReqLabelTaskCreate(
                title=f"{copy_task.title}(副本)",
                description=copy_task.description,
                tool_config=copy_task.tool_config,
                distribute_count=copy_task.distribute_count,
                teams=copy_task.teams,
                expire_time=copy_task.expire_time,
            ),
            user=user,
        )
    except Exception as e:
        print(e)
        return schemas.task.RespCopyTask(is_ok=False, msg="创建任务失败")

    # 创建数据
    try:
        copy_task_data = await crud.data.query(task_id=copy_task.task_id).to_list()
        if copy_task_data:
            datas = [
                models.data.DataCreate(
                    task_id=task_resp.task_id,
                    questionnaire_id=data.questionnaire_id,
                    prompt=data.prompt,
                    conversation_id=data.conversation_id,
                    conversation=data.conversation,
                    reference_evaluation=data.reference_evaluation,
                    custom=data.custom,
                )
                for data in copy_task_data
            ]

            await crud.data.create_many(obj_in=datas)
    except Exception as e:
        print(e)
        return schemas.task.RespCopyTask(is_ok=False, msg="创建数据失败")

    return schemas.task.RespCopyTask(is_ok=True, task_id=task_resp.task_id)


@router.patch(
    "/update",
    summary="更新标注任务",
    description="更新标注任务",
    response_model=schemas.task.DoTaskBase,
)
async def update_label_task(
    req: schemas.operator.task.ReqLabelTaskUpdate = Body(...),
) -> schemas.task.DoTaskBase:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    # 已完成的任务不允许修改
    if task.status == schemas.task.TaskStatus.DONE:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    # 进行中的任务不允许修改任务配置
    if task.status == schemas.task.TaskStatus.OPEN and (
        req.tool_config or req.expire_time
    ):
        raise exceptions.TASK_STATUS_NOT_ALLOW

    # 任务状态不允许越级修改
    if (
        req.status == schemas.task.TaskStatus.DONE
        and task.status != schemas.task.TaskStatus.OPEN
    ) or (
        req.status == schemas.task.TaskStatus.OPEN
        and task.status != schemas.task.TaskStatus.CREATED
    ):
        raise exceptions.PARAMS_ERROR

    task = await crud.label_task.update(
        db_obj=task,
        obj_in=models.label_task.LabelTaskUpdate(
            title=req.title,
            description=req.description,
            status=req.status,
            tool_config=req.tool_config,
            expire_time=req.expire_time,
            teams=req.teams,
        ),
    )

    # 定时任务处理
    if req.status == schemas.task.TaskStatus.OPEN:
        scheduler.add_job(
            label_task_scheduler_job,
            "interval",
            args=[task.task_id],
            seconds=30,
            id=task_scheduler_job_name(task_id=task.task_id),
        )
    elif req.status == schemas.task.TaskStatus.DONE:
        if scheduler.get_job(task_scheduler_job_name(task_id=task.task_id)):
            scheduler.remove_job(task_scheduler_job_name(task_id=task.task_id))

    resp = schemas.task.DoTaskBase(task_id=task.task_id)

    return resp


@router.patch(
    "/batch",
    summary="批量更新标注任务",
    description="批量更新标注任务",
    response_model=schemas.operator.task.RespLabelTaskCreateWithData,
)
async def batch_label_task(
    req: schemas.operator.task.ReqBatchLabelTaskUpdate = Body(...),
) -> schemas.operator.task.RespLabelTaskCreateWithData:
    data = []
    for task_id in req.task_id:
        is_ok = True
        msg = None
        try:
            await update_label_task(
                req=schemas.operator.task.ReqLabelTaskUpdate(
                    task_id=task_id,
                    status=req.status,
                )
            )
        except Exception:
            is_ok = False
            msg = "无法更新任务"
        data.append(
            schemas.operator.task.RespLabelTaskCreateWithDataBase(
                is_ok=is_ok,
                msg=msg,
            )
        )

    return schemas.operator.task.RespLabelTaskCreateWithData(data=data)


@router.post(
    "/list",
    summary="获取标注任务列表",
    description="获取标注任务列表",
    response_model=schemas.operator.task.RespListLabelTask,
)
async def list_label_task(
    req: schemas.operator.task.ReqListTask = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.operator.task.RespListLabelTask:
    db_user = await crud.user.query(user_id=user.user_id).first_or_none()
    if not db_user:
        raise exceptions.USER_NOT_EXIST

    total_q_d = {"title": req.title, "status": req.status, "creator_id": req.creator_id}

    total = await crud.label_task.query(**total_q_d).count()

    if total == 0:
        resp = schemas.operator.task.RespListLabelTask(
            total=0,
            list=[],
        )

        return resp

    if req.page_size == 0:
        resp = schemas.operator.task.RespListLabelTask(
            total=total,
            list=[],
        )

        return resp

    list_task_q = {
        "skip": (req.page - 1) * req.page_size,
        "limit": req.page_size,
        "title": req.title,
        "status": req.status,
        "sort": ["-create_time"],
        "creator_id": req.creator_id,
    }

    tasks = await crud.label_task.query(**list_task_q).to_list()
    if not tasks:
        return schemas.operator.task.RespListLabelTask(
            total=total,
            list=[],
        )

    # 获取用户信息
    user_ids = [task.creator_id for task in tasks]
    users = await crud.user.query(user_id=user_ids).to_list()
    user_name_map = {user.user_id: user.name for user in users or []}

    # 获取任务完成情况
    task_ids = [task.task_id for task in tasks]
    data_count = (
        await crud.data.query(task_id=task_ids)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": "$task_id",
                        "completed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.COMPLETED,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "total": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$in": [
                                            "$source_data_id",
                                            [
                                                None,
                                            ],
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "pending": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.PENDING,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "labeling": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.PROCESSING,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "labeled": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$in": [
                                            "$status",
                                            [
                                                schemas.data.DataStatus.COMPLETED,
                                                schemas.data.DataStatus.DISCARDED,
                                            ],
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "discarded": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.DISCARDED,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                    }
                }
            ],
            projection_model=schemas.operator.task.ViewTaskProgressCount,
        )
        .to_list()
    )
    pending_map = {item.task_id: item.pending for item in data_count or []}
    labeling_map = {item.task_id: item.labeling for item in data_count or []}
    total_map = {item.task_id: item.total for item in data_count or []}

    resp = schemas.operator.task.RespListLabelTask(
        total=total,
        list=[
            schemas.operator.task.ListLabelTaskBase(
                task_id=task.task_id,
                title=task.title,
                status=task.status,
                creator=user_name_map.get(task.creator_id, ""),
                created_time=task.create_time,
                completed_count=total_map.get(task.task_id, 0)
                - pending_map.get(task.task_id, 0)
                - labeling_map.get(task.task_id, 0),
                total_count=total_map.get(task.task_id, 0),
            )
            for task in tasks
        ],
    )

    return resp


@router.post(
    "/detail",
    summary="获取标注任务详情",
    description="获取标注任务详情",
    response_model=schemas.operator.task.RespGetLabelTask,
)
async def get_label_task(
    req: schemas.task.DoTaskBase = Body(...),
) -> schemas.operator.task.RespGetLabelTask:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    user = await crud.user.query(user_id=task.creator_id).first_or_none()
    if not user:
        raise exceptions.SERVER_ERROR

    teams = await crud.team.query(team_id=task.teams).to_list()
    teams_map = {team.team_id: team for team in teams or []}

    data_count = (
        await crud.data.query(task_id=task.task_id)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": "$task_id",
                        "completed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.COMPLETED,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "total": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$in": [
                                            "$source_data_id",
                                            [
                                                None,
                                            ],
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "pending": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.PENDING,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "labeling": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.PROCESSING,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "labeled": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$in": [
                                            "$status",
                                            [
                                                schemas.data.DataStatus.COMPLETED,
                                                schemas.data.DataStatus.DISCARDED,
                                            ],
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "discarded": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.DataStatus.DISCARDED,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                    }
                }
            ],
            projection_model=schemas.operator.task.ViewTaskProgressCount,
        )
        .to_list()
    )
    if not data_count:
        task_progress = schemas.operator.task.LabelTaskProgress(
            completed=0,
            total=0,
            pending=0,
            labeling=0,
            labeled=0,
            discarded=0,
            label_time=0,
        )
    else:
        task_progress = data_count[0]

    # 获取用户分布
    labeling_users_set = set()
    async for record in crud.record.query(
        task_id=task.task_id, status=schemas.record.RecordStatus.PROCESSING
    ):
        labeling_users_set.add(record.creator_id)

    users = await crud.user.query(user_id=list(labeling_users_set)).to_list()

    # 获取任务的标注时间
    task_time_view = (
        await crud.record.query(task_id=task.task_id, is_submit=True)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": "$task_id",
                        "time": {
                            "$sum": {"$subtract": ["$submit_time", "$create_time"]}
                        },
                    }
                }
            ],
            projection_model=schemas.operator.task.ViewTaskTimeCount,
        )
        .to_list()
    )
    label_time = task_time_view[0].time if task_time_view else 0

    resp = schemas.operator.task.RespGetLabelTask(
        task_id=task.task_id,
        title=task.title,
        description=task.description,
        status=task.status,
        created_time=task.create_time,
        creator=user.name,
        distribute_count=task.distribute_count,
        tool_config=task.tool_config,
        expire_time=task.expire_time,
        teams=[
            schemas.team.TeamWithName(
                team_id=team_id,
                name=teams_map[team_id].name if team_id in teams_map else "",
            )
            for team_id in task.teams or []
        ],
        progress=schemas.operator.task.LabelTaskProgress(
            completed=task_progress.total
            - task_progress.pending
            - task_progress.labeling,
            total=task_progress.total,
            pending=task_progress.pending,
            labeling=task_progress.labeling,
            labeled=task_progress.labeled,
            discarded=task_progress.discarded,
            label_time=label_time,
        ),
        users=schemas.operator.task.LabelTaskUsers(
            labeling=[
                schemas.user.DoUserWithUsername(
                    user_id=user.user_id, username=user.name
                )
                for user in users or []
            ]
        ),
    )

    return resp


# 删除任务
@router.post(
    "/delete",
    summary="删除标注任务",
    description="删除标注任务",
)
async def delete_label_task(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    print(f"delete task {req.task_id} by {user.user_id}")

    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status in [schemas.task.TaskStatus.OPEN, schemas.task.TaskStatus.DONE]:
        with tempfile.TemporaryFile() as fp:
            with zipfile.ZipFile(fp, "w") as zf:
                with zf.open("task.json", "w") as f:
                    f.write(task.json(ensure_ascii=False).encode("utf-8"))

                with zf.open("data.jsonl", "w", force_zip64=True) as f:
                    async for data in crud.data.query(task_id=req.task_id):
                        f.write((data.json(ensure_ascii=False) + "\n").encode("utf-8"))

                with zf.open("record.jsonl", "w", force_zip64=True) as f:
                    async for record in crud.record.query(task_id=req.task_id):
                        f.write(
                            (record.json(ensure_ascii=False) + "\n").encode("utf-8")
                        )

            fp.seek(0)
            minio.minio.client.put_object(
                settings.MINIO_BUCKET,
                f"{settings.ENVIRONMENT}task_backup/{req.task_id}.zip",
                fp,
                length=fp.tell(),
            )

    await crud.label_task.remove(task.id)
    await crud.data.query(task_id=req.task_id).delete()
    await crud.record.query(task_id=req.task_id).delete()

    return {}


@router.post(
    "/data/batch_create",
    summary="批量创建数据",
    description="批量创建数据",
)
async def batch_create_data(
    req: schemas.task.ReqBatchCreateData = Body(...),
):
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status == schemas.task.TaskStatus.DONE:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    tasks = [
        models.data.DataCreate(
            task_id=req.task_id,
            questionnaire_id=data.questionnaire_id,
            prompt=data.prompt,
            conversation_id=data.conversation_id,
            conversation=data.conversation,
            reference_evaluation=data.reference_evaluation,
            custom=data.custom,
        )
        for data in req.datas
        for _ in range(task.distribute_count)
    ]

    await crud.data.create_many(obj_in=tasks)

    return


@router.post(
    "/data/clear",
    summary="清空数据",
    description="清空数据",
)
async def clear_data(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    print(f"clear data, task_id: {req.task_id}, user_id: {user.user_id}")
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status != schemas.task.TaskStatus.CREATED:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    await crud.data.query(task_id=req.task_id).delete()


@router.post(
    "/data/reject",
    summary="打回数据",
    description="打回数据",
)
async def reject_data(
    req: schemas.operator.task.ReqRejectData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    try:
        async with redis_session.lock(
            f"audit_task_scheduler_job_{req.task_id}", blocking=False
        ):
            # 获取任务
            task = await crud.label_task.query(task_id=req.task_id).first_or_none()
            if not task:
                raise exceptions.TASK_NOT_EXIST

            # 获取已完成的标注记录（排除已经被打回的）
            records = await crud.record.query(
                task_id=req.task_id,
                user_id=req.user_id,
                data_id=req.data_id,
                is_submit=True,
                status=schemas.record.RecordStatus.COMPLETED,
            ).to_list()
            if not records:
                return

            data_ids = [record.data_id for record in records]

            # 要新建的数据
            new_datas = []
            # 被新建的数据id
            new_data_ids = []

            # 获取数据
            datas = await crud.data.query(
                task_id=req.task_id, data_id=data_ids
            ).to_list()

            # 如果没有审核任务，直接创建新的数据
            for data in datas:
                new_datas.append(
                    models.data.DataCreate(
                        task_id=task.task_id,
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
                new_data_ids.append(data.data_id)

            if len(new_datas) > 0:
                await crud.data.query(task_id=req.task_id, data_id=new_data_ids).set(
                    {
                        models.data.Data.status: schemas.data.DataStatus.DISCARDED,
                    }
                )  # type: ignore
                await crud.record.query(
                    task_id=req.task_id, data_id=new_data_ids, user_id=req.user_id
                ).set(
                    {models.record.Record.status: schemas.record.RecordStatus.DISCARDED}
                )  # type: ignore
                if req.is_data_recreate:
                    await crud.data.create_many(obj_in=new_datas)

            return
    except LockError:
        raise exceptions.SERVER_ERROR


@router.get(
    "/data/export",
    summary="导出数据",
    description="导出数据",
    response_class=StreamingResponse,
)
async def export_data(
    task_id: UUID | list[UUID] = Query(...),
    submit: schemas.operator.task.SubmitStatus | None = Query(None),
    qualified: schemas.operator.task.QualifiedStatus | None = Query(None),
    invalid: bool | None = Query(None),
):
    task_count = await crud.label_task.query(task_id=task_id).count()
    if task_count == 0:
        raise exceptions.TASK_NOT_EXIST

    status = None
    if submit is not None:
        if submit == schemas.operator.task.SubmitStatus.SUBMITTED:
            status = [
                schemas.data.DataStatus.COMPLETED,
                schemas.data.DataStatus.DISCARDED,
            ]
        elif submit == schemas.operator.task.SubmitStatus.UN_SUBMITTED:
            status = [
                schemas.data.DataStatus.PENDING,
                schemas.data.DataStatus.PROCESSING,
            ]

    if qualified is not None:
        if qualified == schemas.operator.task.QualifiedStatus.COMPLETED:
            if status is None:
                status = [schemas.data.DataStatus.COMPLETED]
            else:
                status = list(set(status) & {schemas.data.DataStatus.COMPLETED})
        elif qualified == schemas.operator.task.QualifiedStatus.DISCARDED:
            if status is None:
                status = [schemas.data.DataStatus.DISCARDED]
            else:
                status = list(set(status) & {schemas.data.DataStatus.DISCARDED})

    async def export_stream_data(task_id) -> AsyncGenerator:
        datas = ""
        index = 0
        async for data in crud.data.query(
            task_id=task_id, status=status, invalid=invalid
        ):
            index += 1
            datas += (
                schemas.data.DoData.model_validate(
                    data, from_attributes=True
                ).model_dump_json()
                + "\n"
            )

            if index % 100 == 0:
                yield datas
                datas = ""

        if datas:
            yield datas

    async def zip_generator(task_id: list[UUID]) -> AsyncGenerator[bytes, None]:
        tasks = await crud.label_task.query(task_id=task_id).to_list()
        task_h = {task.task_id: task for task in tasks}
        title_set = set()
        title_map = {}
        with io.BytesIO() as zip_buffer:
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for tid in task_id:
                    data_buffer = io.StringIO()
                    async for chunk in export_stream_data(tid):
                        data_buffer.write(chunk)
                    data_buffer.seek(0)
                    if task_h[tid].title not in title_set:
                        title_set.add(task_h[tid].title)
                        title = task_h[tid].title
                        title_map[title] = 1
                    else:
                        title = f"{task_h[tid].title}({title_map[task_h[tid].title]})"
                        title_map[task_h[tid].title] += 1
                    zip_file.writestr(f"{title}.jsonl", data_buffer.read())

            zip_buffer.seek(0)
            yield zip_buffer.read()

    if task_count == 1:
        task = await crud.label_task.query(task_id=task_id).first_or_none()
        if not task:
            raise exceptions.TASK_NOT_EXIST
        filename = urllib.parse.quote(task.title)
        resp = StreamingResponse(
            content=export_stream_data(task_id),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}.jsonl"},
        )
    else:
        resp = StreamingResponse(
            content=zip_generator(task_id),  # type: ignore
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M%S')}.zip"
            },
        )
    return resp


@router.post(
    "/data/list_by_questionnaire_id",
    summary="记录列表",
    description="记录列表",
    response_model=schemas.operator.task.RespQuestionnaireDataIDs,
)
async def list_by_questionnaire_id(
    req: schemas.operator.task.ReqQuestionnaireDataIDs = Body(...),
) -> schemas.operator.task.RespQuestionnaireDataIDs:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    datas: list[models.data.Data] = await crud.data.query(
        task_id=task.task_id,
        questionnaire_id=req.questionnaire_id,
        invalid=True
        if req.record_status == schemas.operator.task.RecordFullStatus.INVALID
        else None,
    ).to_list()

    return schemas.operator.task.RespQuestionnaireDataIDs(
        data=[v.data_id for v in datas]
    )


@router.get(
    "/record/export",
    summary="导出标注记录",
    description="导出标注记录",
    response_class=StreamingResponse,
)
async def export_record(
    task_id: UUID | list[UUID] = Query(...),
):
    task_count = await crud.label_task.query(task_id=task_id).count()
    if task_count == 0:
        raise exceptions.TASK_NOT_EXIST

    user_name_map = defaultdict(str)
    async for user in crud.user.query():
        user_name_map[user.user_id] = user.name

    async def export_stream_data(task_id) -> AsyncGenerator:
        records = ""
        index = 0
        async for record in crud.record.query(task_id=task_id, is_submit=True):
            index += 1
            do_record = schemas.record.DoRecord.model_validate(
                record, from_attributes=True
            )
            record_dict = do_record.model_dump()
            record_dict["creator"] = user_name_map[do_record.creator_id]
            records += orjson.dumps(record_dict).decode("utf-8") + "\n"

            if index % 100 == 0:
                yield records
                records = ""

        if records:
            yield records

    async def zip_generator(task_id: list[UUID]) -> AsyncGenerator[bytes, None]:
        tasks = await crud.label_task.query(task_id=task_id).to_list()
        task_h = {task.task_id: task for task in tasks}
        title_set = set()
        title_map = {}
        with io.BytesIO() as zip_buffer:
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for tid in task_id:
                    data_buffer = io.StringIO()
                    async for chunk in export_stream_data(tid):
                        data_buffer.write(chunk)
                    data_buffer.seek(0)
                    if task_h[tid].title not in title_set:
                        title_set.add(task_h[tid].title)
                        title = task_h[tid].title
                        title_map[title] = 1
                    else:
                        title = f"{task_h[tid].title}({title_map[task_h[tid].title]})"
                        title_map[task_h[tid].title] += 1
                    zip_file.writestr(f"{title}.jsonl", data_buffer.read())
            zip_buffer.seek(0)
            yield zip_buffer.read()

    if task_count == 1:
        task = await crud.label_task.query(task_id=task_id).first_or_none()
        if not task:
            raise exceptions.TASK_NOT_EXIST
        filename = urllib.parse.quote(task.title)
        resp = StreamingResponse(
            content=export_stream_data(task_id),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}.jsonl"},
        )
    else:
        resp = StreamingResponse(
            content=zip_generator(task_id),  # type: ignore
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M%S')}.zip"
            },
        )

    return resp


# 导出工作量
@router.get(
    "/data/export_workload",
    summary="导出工作量",
    description="导出工作量",
    response_class=Response,
)
async def export_workload(
    task_id: UUID | list[UUID] = Query(...),
):
    task_count = await crud.label_task.query(task_id=task_id).count()
    if task_count == 0:
        raise exceptions.TASK_NOT_EXIST

    # 用户答题总数
    task_user_data_count: defaultdict = defaultdict(int)
    # 用户未达标题数
    task_user_data_discarded_count: defaultdict = defaultdict(int)
    # 用户答题总时长（秒）
    task_user_data_duration: defaultdict = defaultdict(int)
    # 用户id set
    task_user_ids_set: set[tuple[UUID, str]] = set()

    async for record in crud.record.query(task_id=task_id, is_submit=True):
        key = (record.task_id, record.creator_id)
        task_user_ids_set.add(key)
        task_user_data_count[key] += 1
        task_user_data_duration[key] += (
            (record.submit_time - record.create_time) if record.submit_time else 0
        )
        if record.status == schemas.data.DataStatus.DISCARDED:
            task_user_data_discarded_count[key] += 1

    user_ids = list(set([user_id for _, user_id in task_user_ids_set]))
    users = await crud.user.query(user_id=user_ids).to_list()
    user_name_map = {user.user_id: user.name for user in users}

    teams = await crud.team.query(user_id=user_ids).to_list()
    user_teams: defaultdict = defaultdict(list)
    for team in teams:
        for t_user in team.users:
            user_teams[t_user.user_id].append(team.name)

    tasks = await crud.label_task.query(task_id=task_id).to_list()
    task_h = {task.task_id: task for task in tasks}

    headers = [
        "任务ID",
        "任务名称",
        "用户ID",
        "用户名",
        "所属团队",
        "答题效率（题/小时）",
        "答题时长（小时）",
        "答题数",
        "未达标题数",
        "未达标率",
    ]
    colummns: list[list[str]] = []
    for task_id, user_id in task_user_ids_set:
        key = (task_id, user_id)
        colummns.append(
            [
                str(task_id),
                task_h[task_id].title,
                user_id,
                user_name_map[user_id] if user_id in user_name_map else "",
                ",".join(user_teams[user_id]) if user_id in user_teams else "",
                f"{(task_user_data_count[key] / task_user_data_duration[key] * 60 * 60):.2f}",
                f"{(task_user_data_duration[key]/60/60):.4f}",
                task_user_data_count[key],
                task_user_data_discarded_count[key],
                f"{(task_user_data_discarded_count[key]/task_user_data_count[key]*100):.2f}%",
            ]
        )

    colummns = sorted(colummns, key=itemgetter(0, 2))

    # 生成excel
    wb = Workbook()
    ws = wb.active
    ws.append(headers)  # type: ignore
    for row in colummns:
        ws.append(row)  # type: ignore

    # 保存到临时文件
    with tempfile.TemporaryFile() as fp:
        wb.save(fp)
        fp.seek(0)
        data = fp.read()

    resp = Response(
        content=data,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M')}.xlsx"
        },
    )

    return resp


@router.post(
    "/data/preview/ids",
    summary="获取预览数据 id",
    description="预览数据 id",
    response_model=schemas.operator.task.RespPreviewDataID,
)
async def preview_data_ids(
    req: schemas.operator.task.ReqPreviewDataID = Body(...),
) -> schemas.operator.task.RespPreviewDataID:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if req.user_id is not None:
        data_ids = [
            i.data_id
            for i in await crud.record.query(
                task_id=task.task_id,
                user_id=req.user_id,
            ).to_list()
        ]
    else:
        data_ids = None

    if req.kind == schemas.operator.stats.ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:

        records = await crud.data.query(
            task_id=task.task_id,
            data_id=data_ids,
            sort="data_id",
            status=req.record_status
            if req.record_status
            in (
                schemas.data.DataStatus.COMPLETED,
                schemas.data.DataStatus.DISCARDED,
            )
            else None,
            invalid=True
            if req.record_status == schemas.record.RecordFullStatus.INVALID
            else None,
        ).to_list()
    else:

        class AggProjectModel(BaseModel):
            questionnaire_id: UUID = Field(description="问卷 ID")
            data_id: UUID = Field(description="问卷下某个 data_id")

        records = (
            await crud.data.query(
                task_id=task.task_id,
                data_id=data_ids,
                sort="data_id",
                invalid=True
                if req.record_status == schemas.record.RecordFullStatus.INVALID
                else None,
            )
            .aggregate(
                [
                    {"$project": {"questionnaire_id": 1, "data_id": 1}},
                ],
                projection_model=AggProjectModel,
            )
            .to_list()
        )

    record = None
    if req.pos_locate == schemas.task.RecordPosLocateKind.CURRENT:
        if records:
            record = records[0]
    elif req.pos_locate == schemas.task.RecordPosLocateKind.NEXT:
        stop = False
        for r in records:
            if stop:
                record = r
                break
            if r.data_id == req.data_id:
                stop = True
    elif req.pos_locate == schemas.task.RecordPosLocateKind.PRE:
        for r in records:
            if r.data_id == req.data_id:
                break
            record = r
    return schemas.operator.task.RespPreviewDataID(
        task_id=req.task_id,
        data_id=record.data_id if record else None,
        questionnaire_id=record.questionnaire_id if record else None,
    )


# 预览配置
@router.post(
    "/data/preview",
    summary="预览数据",
    description="预览数据",
    response_model=schemas.operator.task.RespPreviewData,
)
async def preview_data(
    req: schemas.operator.task.ReqPreviewData = Body(...),
) -> schemas.operator.task.RespPreviewData:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if req.user_id is not None:
        data_ids = [
            i.data_id
            for i in await crud.record.query(
                task_id=task.task_id,
                user_id=req.user_id,
            ).to_list()
        ]
    else:
        data_ids = None

    datas = (
        await crud.data.query(
            task_id=task.task_id,
            data_id=req.data_id if req.data_id else data_ids,
            sort="data_id",
            status=req.record_status
            if req.record_status
            in (
                schemas.data.DataStatus.COMPLETED,
                schemas.data.DataStatus.DISCARDED,
            )
            else None,
            questionnaire_id=req.questionnaire_id,
            invalid=True
            if req.record_status == schemas.record.RecordFullStatus.INVALID
            else None,
        )
        .aggregate(
            [
                {"$limit": 1} if req.record_status else {"$sample": {"size": 1}},
            ],
            projection_model=models.data.Data,
        )
        .to_list()
    )

    if not datas:
        raise exceptions.DATA_NOT_EXIST

    data = datas[0]

    record = await crud.record.query(
        task_id=task.task_id,
        data_id=data.data_id,
        user_id=req.user_id,
    ).first_or_none()

    label_user = (
        await crud.user.query(user_id=record.creator_id).first_or_none()
        if record
        else None
    )

    resp = schemas.operator.task.RespPreviewData(
        questionnaire_id=data.questionnaire_id,
        data_id=data.data_id,
        prompt=data.prompt,
        conversation=[
            schemas.message.MessageBase.model_validate(message, from_attributes=True)
            for message in data.conversation
        ],
        evaluation=schemas.evaluation.SingleEvaluation.model_validate(
            data.evaluation, from_attributes=True
        ),
        reference_evaluation=data.reference_evaluation,
        label_user=(
            schemas.user.DoUserWithUsername(
                user_id=label_user.user_id,
                username=label_user.name,
            )
            if label_user
            else None
        ),
        status=data.status,
    )

    return resp


@router.post(
    "/record/group/user",
    summary="数据统计-用户维度",
    description="数据统计-用户维度",
    response_model=schemas.operator.task.RespGroupRecordByUser,
)
async def group_record_by_user(
    req: schemas.operator.task.ReqGroupRecordByUser = Body(...),
):
    if req.username is not None:
        users = await crud.user.query(name=req.username).to_list()
        user_ids = [user.user_id for user in users]
    else:
        user_ids = None

    aggregate_res = (
        await crud.record.query(user_id=user_ids, task_id=req.task_id, is_submit=True)
        .aggregate(
            [{"$group": {"_id": "$creator_id"}}, {"$count": "total"}],
        )
        .to_list()
    )

    total = aggregate_res[0]["total"] if aggregate_res else 0

    if total == 0:
        return schemas.operator.task.RespGroupRecordByUser(
            total=0,
            list=[],
        )

    if req.page_size == 0:
        return schemas.operator.task.RespGroupRecordByUser(
            total=total,
            list=[],
        )

    record_count = (
        await crud.record.query(user_id=user_ids, task_id=req.task_id, is_submit=True)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": "$creator_id",
                        "completed_data_count": {"$sum": 1},
                        "discarded_data_count": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.record.RecordStatus.DISCARDED,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                    }
                },
                (
                    {
                        "$sort": {
                            "discarded_data_count": (
                                1 if req.sort == "discarded_asc" else -1
                            ),
                        }
                    }
                    if req.sort
                    else {"$sort": {"_id": 1}}
                ),
                {
                    "$skip": (req.page - 1) * req.page_size,
                },
                {
                    "$limit": req.page_size,
                },
            ],
            projection_model=schemas.record.ViewGroupUser,
        )
        .to_list()
    )

    user_ids = [record.user_id for record in record_count]
    users = await crud.user.query(user_id=user_ids).to_list()
    user_name_map = {user.user_id: user.name for user in users}

    resp = schemas.operator.task.RespGroupRecordByUser(
        total=total,
        list=[
            schemas.operator.task.GroupDataByUser(
                label_user=schemas.user.DoUserWithUsername(
                    user_id=item.user_id,
                    username=(
                        user_name_map[item.user_id]
                        if item.user_id in user_name_map
                        else ""
                    ),
                ),
                completed=item.completed_data_count,
                discarded=item.discarded_data_count,
            )
            for item in record_count
        ],
    )

    return resp


@router.post(
    "/record/preview",
    summary="预览记录",
    description="预览记录",
    response_model=schemas.operator.task.RespPreviewRecord,
)
async def preview_record(
    req: schemas.operator.task.ReqPreviewRecord = Body(...),
):
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    records = (
        await crud.record.query(
            task_id=task.task_id,
            user_id=req.user_id,
            status=req.record_status,
            is_submit=True,
        )
        .aggregate(
            [
                {"$sample": {"size": 1}},
            ],
            projection_model=models.record.Record,
        )
        .to_list()
    )

    if not records:
        raise exceptions.RECORD_NOT_EXIST

    record = records[0]

    data = await crud.data.query(
        task_id=task.task_id,
        data_id=record.data_id,
    ).first_or_none()
    if not data:
        raise exceptions.SERVER_ERROR

    user = await crud.user.query(user_id=record.creator_id).first_or_none()

    resp = schemas.operator.task.RespPreviewRecord(
        questionnaire_id=data.questionnaire_id,
        data_id=data.data_id,
        prompt=data.prompt,
        conversation=[
            schemas.message.MessageBase.model_validate(message, from_attributes=True)
            for message in data.conversation
        ],
        evaluation=schemas.evaluation.SingleEvaluation.model_validate(
            record.evaluation, from_attributes=True
        ),
        reference_evaluation=data.reference_evaluation,
        label_user=schemas.user.DoUserWithUsername(
            user_id=record.creator_id,
            username=user.name if user else "",
        ),
    )

    return resp


@router.post(
    "/record/list",
    summary="记录列表",
    description="记录列表",
    response_model=schemas.operator.task.RespRecordList,
)
async def record_list(
    req: schemas.operator.task.ReqRecordList = Body(...),
):
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    total = await crud.record.query(
        task_id=task.task_id,
        user_id=req.user_id,
        status=req.status,
        is_submit=True,
    ).count()
    if total == 0:
        return schemas.operator.task.RespRecordList(
            total=0,
            list=[],
        )

    if req.page_size == 0:
        return schemas.operator.task.RespRecordList(
            total=total,
            list=[],
        )

    return schemas.operator.task.RespRecordList(total=total, list=[])
