import tempfile
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from uuid import UUID

import orjson
from fastapi import APIRouter, Body, Depends
from fastapi.responses import Response, StreamingResponse
from loguru._logger import Logger
from openpyxl import Workbook

from app import crud, models, schemas
from app.api import deps
from app.api.v1.const.common import get_audit_review_record
from app.client.oss import oss
from app.core import exceptions
from app.core.config import settings
from app.scheduler import scheduler
from app.scheduler.task import audit_task_scheduler_job, task_scheduler_job_name
from app.schemas.message import MessageBase

router = APIRouter(prefix="/task/audit")


@router.post(
    "/create",
    summary="创建审核任务",
    description="创建审核任务",
    response_model=schemas.task.DoTaskBase,
)
async def create_audit_task(
    req: schemas.operator.task.ReqAuditTaskCreate = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.task.DoTaskBase:
    task = await crud.audit_task.create(
        obj_in=models.audit_task.AuditTaskCreate(
            title=req.title,
            description=req.description,
            creator_id=user.user_id,
            tool_config=req.tool_config,
        )
    )

    resp = schemas.task.DoTaskBase(task_id=task.task_id)

    return resp


@router.patch(
    "/update",
    summary="更新审核任务",
    description="更新审核任务",
    response_model=schemas.task.DoTaskBase,
)
async def update_audit_task(
    req: schemas.operator.task.ReqAuditTaskUpdate = Body(...),
) -> schemas.task.DoTaskBase:
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if req.flow:
        for flow in req.flow:
            if 0 > flow.sample_ratio or flow.sample_ratio > 100:
                raise exceptions.FLOW_RATIO_ILLEGAL

    # 已完成的任务不允许修改
    if task.status == schemas.task.TaskStatus.DONE:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    # 进行中的任务不允许修改任务配置
    if task.status == schemas.task.TaskStatus.OPEN and (
        req.tool_config or req.target_task_id or req.is_data_recreate or req.flow
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

    if req.flow is not None and len(req.flow or []) == 0:
        raise exceptions.PARAMS_ERROR

    if (
        req.target_task_id is not None
        and await crud.audit_task.query(
            target_task_id=req.target_task_id
        ).first_or_none()
    ):
        raise exceptions.TASK_HAS_AUDIT_TASK

    task = await crud.audit_task.update(
        db_obj=task,
        obj_in=models.audit_task.AuditTaskUpdate(
            title=req.title,
            description=req.description,
            status=req.status,
            tool_config=req.tool_config,
            target_task_id=req.target_task_id,
            is_data_recreate=req.is_data_recreate,
        ),
    )

    if req.flow is not None:
        # 删除原有的审核流程
        await crud.audit_flow.query(task_id=req.task_id).delete()

        # 创建新的审核流程
        flows = [
            models.audit_task.AuditFlowCreate(
                task_id=task.task_id,
                index=index + 1,
                sample_ratio=flow.sample_ratio or 100,
                max_audit_count=flow.max_audit_count,
                pass_audit_count=flow.pass_audit_count,
                expire_time=flow.expire_time,
                teams=flow.teams,
            )
            for index, flow in enumerate(req.flow or [])
        ]
        flows[-1].is_last = True

        await crud.audit_flow.create_many(obj_in=flows)

    # 定时任务处理
    if req.status == schemas.task.TaskStatus.OPEN:
        scheduler.add_job(
            audit_task_scheduler_job,
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


# 更新流程执行团队
@router.put(
    "/flow/team/update",
    summary="更新审核流程执行团队",
    description="更新审核流程执行团队",
    response_model=schemas.task.DoTaskBase,
)
async def update_audit_flow_teams(
    req: schemas.operator.task.ReqAuditTaskTeamUpdate = Body(...),
) -> schemas.task.DoTaskBase:
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    # 已完成的任务不允许修改
    if task.status == schemas.task.TaskStatus.DONE:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    flow = await crud.audit_flow.query(
        task_id=req.task_id, index=req.flow_index
    ).first_or_none()
    if not flow:
        raise exceptions.FLOW_NOT_EXIST

    await crud.audit_flow.update(
        db_obj=flow,
        obj_in=models.audit_task.AuditFlowUpdate(
            teams=req.teams,
        ),
    )

    resp = schemas.task.DoTaskBase(task_id=task.task_id)

    return resp


@router.post(
    "/list",
    summary="获取审核任务列表",
    description="获取审核任务列表",
    response_model=schemas.operator.task.RespListAuditTask,
)
async def list_audit_task(
    req: schemas.operator.task.ReqListTask = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    db_user = await crud.user.query(user_id=user.user_id).first_or_none()
    if not db_user:
        raise exceptions.USER_NOT_EXIST

    total_q_d = {"title": req.title, "status": req.status, "creator_id": req.creator_id}
    if db_user.role != schemas.user.UserType.SUPER_ADMIN:
        total_q_d["creator_id"] = db_user.user_id

    total = await crud.audit_task.query(**total_q_d).count()

    if total == 0:
        resp = schemas.operator.task.RespListAuditTask(total=0, list=[])

        return resp

    if req.page_size == 0:
        resp = schemas.operator.task.RespListAuditTask(total=total, list=[])

        return resp

    list_task_q = {
        "skip": (req.page - 1) * req.page_size,
        "limit": req.page_size,
        "title": req.title,
        "status": req.status,
        "sort": ["-create_time"],
        "creator_id": req.creator_id,
    }

    if db_user.role != schemas.user.UserType.SUPER_ADMIN:
        list_task_q["creator_id"] = db_user.user_id

    tasks = await crud.audit_task.query(**list_task_q).to_list()
    if not tasks:
        return schemas.operator.task.RespListAuditTask(total=0, list=[])
    task_ids = [task.task_id for task in tasks]

    user_ids = [task.creator_id for task in tasks]
    users = await crud.user.query(user_id=user_ids).to_list()
    user_name_map = {user.user_id: user.name for user in users or []}

    flows = await crud.audit_flow.query(task_id=task_ids).to_list()
    task_flow_map: defaultdict = defaultdict(list[int])
    for flow in flows:
        task_flow_map[flow.task_id].append(flow.index)

    for task_id, flow in task_flow_map.items():
        task_flow_map[task_id] = sorted(flow)

    # 获取任务完成情况

    data_count = (
        await crud.audit_flow_data.query(task_id=task_ids)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": {
                            "task_id": "$task_id",
                            "index": "$index",
                        },
                        "completed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.FlowDataStatus.COMPLETED,
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
                                            "$status",
                                            [
                                                schemas.data.FlowDataStatus.PENDING,
                                                schemas.data.FlowDataStatus.PROCESSING,
                                                schemas.data.FlowDataStatus.COMPLETED,
                                            ],
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
            projection_model=schemas.operator.task.ViewAuditTaskDataCount,
        )
        .to_list()
    )
    completed_map = {
        f"{item.view_id.task_id}_{item.view_id.index}": item.completed
        for item in data_count or []
    }
    total_map = {
        f"{item.view_id.task_id}_{item.view_id.index}": item.total
        for item in data_count or []
    }

    resp = schemas.operator.task.RespListAuditTask(
        total=total,
        list=[
            schemas.operator.task.ListAuditTaskBase(
                task_id=task.task_id,
                title=task.title,
                status=task.status,
                creator=user_name_map.get(task.creator_id, ""),
                created_time=task.create_time,
                flow=[
                    schemas.operator.task.AuditTaskFlowProgressForList(
                        flow_index=index,
                        completed_count=completed_map.get(f"{task.task_id}_{index}", 0),
                        total_count=total_map.get(f"{task.task_id}_{index}", 0),
                    )
                    for index in task_flow_map.get(task.task_id, [])
                ],
            )
            for task in tasks
        ],
    )

    return resp


@router.post(
    "/detail",
    summary="获取审核任务详情",
    description="获取审核任务详情",
    response_model=schemas.operator.task.RespGetAuditTask,
)
async def get_audit_task(
    req: schemas.task.DoTaskBase = Body(...),
):
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    target_task = await crud.label_task.query(
        task_id=task.target_task_id
    ).first_or_none()

    user = await crud.user.query(user_id=task.creator_id).first_or_none()
    if not user:
        raise exceptions.SERVER_ERROR

    flows = await crud.audit_flow.query(task_id=task.task_id).to_list()
    team_ids = []
    for flow in flows:
        team_ids.extend(flow.teams)
    teams = await crud.team.query(team_id=team_ids).to_list()
    teams_map = {team.team_id: team for team in teams or []}

    # 获取任务完成情况
    data_count = (
        await crud.audit_flow_data.query(task_id=task.task_id)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": "$index",
                        "completed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.FlowDataStatus.COMPLETED,
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
                                            "$status",
                                            [
                                                schemas.data.FlowDataStatus.PENDING,
                                                schemas.data.FlowDataStatus.PROCESSING,
                                                schemas.data.FlowDataStatus.COMPLETED,
                                            ],
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "passed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$and": [
                                            {
                                                "$eq": [
                                                    "$status",
                                                    schemas.data.FlowDataStatus.COMPLETED,
                                                ]
                                            },
                                            {
                                                "$eq": [
                                                    "$remain_pass_count",
                                                    0,
                                                ]
                                            },
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "unpassed": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$and": [
                                            {
                                                "$eq": [
                                                    "$status",
                                                    schemas.data.FlowDataStatus.COMPLETED,
                                                ]
                                            },
                                            {
                                                "$gt": [
                                                    "$remain_pass_count",
                                                    0,
                                                ]
                                            },
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
                                        "$in": [
                                            "$status",
                                            [
                                                schemas.data.FlowDataStatus.PENDING,
                                                schemas.data.FlowDataStatus.PROCESSING,
                                            ],
                                        ]
                                    },
                                    "$remain_audit_count",
                                    0,
                                ]
                            }
                        },
                        "auditing": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.FlowDataStatus.PROCESSING,
                                        ]
                                    },
                                    1,
                                    0,
                                ]
                            }
                        },
                        "approved": {"$sum": {"$size": "$pass_audit_user_ids"}},
                        "rejected": {"$sum": {"$size": "$reject_audit_user_ids"}},
                        "skipped": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$eq": [
                                            "$status",
                                            schemas.data.FlowDataStatus.COMPLETED,
                                        ]
                                    },
                                    "$remain_audit_count",
                                    0,
                                ]
                            }
                        },
                    }
                }
            ],
            projection_model=schemas.operator.task.ViewAuditTaskProgressCount,
        )
        .to_list()
    )
    progress_count_map = {item.index: item for item in data_count or []}
    for idx in (2, len(progress_count_map) + 1):
        if idx in progress_count_map and (idx - 1) in progress_count_map:
            progress_count_map[idx].pre_total = progress_count_map[idx - 1].total

    if 1 in progress_count_map:
        label_record_count = (
            await crud.record.query(task_id=task.target_task_id)
            .aggregate(
                [
                    {
                        "$group": {
                            "_id": "$task_id",
                            "total": {
                                "$sum": {
                                    "$cond": [
                                        {
                                            "$in": [
                                                "$status",
                                                [
                                                    schemas.record.RecordStatus.COMPLETED,
                                                    schemas.record.RecordStatus.DISCARDED,
                                                ],
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
                projection_model=schemas.operator.task.TaskDataTotal,
            )
            .to_list()
        )

        if label_record_count:
            progress_count_map[1].pre_total = label_record_count[0].total

    # 获取任务的标注时间
    task_time_view = (
        await crud.record.query(task_id=task.task_id, is_submit=True)
        .aggregate(
            [
                {
                    "$group": {
                        "_id": {
                            "task_id": "$task_id",
                            "index": "$flow_index",
                        },
                        "time": {
                            "$sum": {"$subtract": ["$submit_time", "$create_time"]}
                        },
                    }
                }
            ],
            projection_model=schemas.operator.task.ViewAuditTaskTimeCount,
        )
        .to_list()
    )
    task_time_map = {
        f"{item.view_id.task_id}_{item.view_id.index}": item.time
        for item in task_time_view or []
    }

    resp = schemas.operator.task.RespGetAuditTask(
        task_id=task.task_id,
        title=task.title,
        description=task.description,
        status=task.status,
        created_time=task.create_time,
        creator=user.name,
        tool_config=task.tool_config,
        target_task=(
            schemas.operator.task.DoTaskWithStatus(
                task_id=target_task.task_id,
                title=target_task.title,
                description=target_task.description,
                tool_config=target_task.tool_config,
                status=target_task.status,
            )
            if target_task
            else None
        ),
        is_data_recreate=task.is_data_recreate,
        flow=[
            schemas.operator.task.AuditTaskFlowForDetail(
                flow_index=flow.index,
                expire_time=flow.expire_time,
                max_audit_count=flow.max_audit_count,
                pass_audit_count=flow.pass_audit_count,
                sample_ratio=flow.sample_ratio or 100,
                teams=[
                    schemas.team.TeamWithName(
                        team_id=team_id,
                        name=teams_map[team_id].name if team_id in teams_map else "",
                    )
                    for team_id in flow.teams
                ],
            )
            for flow in flows
        ],
        progress=[
            (
                schemas.operator.task.AuditTaskFlowProgresssForDetail(
                    flow_index=flow.index,
                    completed=progress_count_map[flow.index].completed,
                    pre_total=progress_count_map[flow.index].pre_total,
                    total=progress_count_map[flow.index].total,
                    passed=progress_count_map[flow.index].passed,
                    unpassed=progress_count_map[flow.index].unpassed,
                    pending=progress_count_map[flow.index].pending
                    - progress_count_map[flow.index].auditing,
                    auditing=progress_count_map[flow.index].auditing,
                    approved=progress_count_map[flow.index].approved,
                    rejected=progress_count_map[flow.index].rejected,
                    skipped=progress_count_map[flow.index].skipped,
                    audit_time=task_time_map.get(f"{task.task_id}_{flow.index}", 0),
                )
                if flow.index in progress_count_map
                else schemas.operator.task.AuditTaskFlowProgresssForDetail(
                    flow_index=flow.index,
                    completed=0,
                    total=0,
                    pre_total=0,
                    passed=0,
                    unpassed=0,
                    pending=0,
                    auditing=0,
                    approved=0,
                    rejected=0,
                    skipped=0,
                    audit_time=0,
                )
            )
            for flow in flows
        ],
    )

    return resp


# 删除任务
@router.post(
    "/delete",
    summary="删除标注任务",
    description="删除标注任务",
)
async def delete_audit_task(
    req: schemas.task.DoTaskBase = Body(...),
    logger: Logger = Depends(deps.get_logger),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    logger.info(f"delete task {req.task_id} by {user.user_id}")

    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status in [schemas.task.TaskStatus.OPEN, schemas.task.TaskStatus.DONE]:
        with tempfile.TemporaryFile() as fp:
            with zipfile.ZipFile(fp, "w") as zf:
                with zf.open("task.json", "w") as f:
                    f.write(task.json(ensure_ascii=False).encode("utf-8"))

                with zf.open("flow.jsonl", "w") as f:
                    async for flow in crud.audit_flow.query(task_id=req.task_id):
                        f.write((flow.json(ensure_ascii=False) + "\n").encode("utf-8"))

                with zf.open("flow_data.jsonl", "w", force_zip64=True) as f:
                    async for flow_data in crud.audit_flow_data.query(
                        task_id=req.task_id
                    ):
                        f.write(
                            (flow_data.json(ensure_ascii=False) + "\n").encode("utf-8")
                        )

                with zf.open("record.jsonl", "w", force_zip64=True) as f:
                    async for record in crud.record.query(task_id=req.task_id):
                        f.write(
                            (record.json(ensure_ascii=False) + "\n").encode("utf-8")
                        )

                with zf.open("data.jsonl", "w", force_zip64=True) as f:
                    async for data in crud.data.query(task_id=req.task_id):
                        f.write((data.json(ensure_ascii=False) + "\n").encode("utf-8"))

            fp.seek(0)
            oss.internal_client.put_object(
                f"{settings.ENVIRONMENT}/task_backup/{req.task_id}.zip", fp
            )

    await crud.audit_task.remove(task.id)
    await crud.audit_flow.query(task_id=req.task_id).delete()
    await crud.audit_flow_data.query(task_id=req.task_id).delete()
    await crud.record.query(task_id=req.task_id).delete()
    await crud.data.query(task_id=req.task_id).delete()


@router.get(
    "/data/export",
    summary="导出数据",
    description="导出数据",
    response_class=StreamingResponse,
)
async def export_data(
    task_id: UUID,
):
    task = await crud.audit_task.query(task_id=task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    async def export_stream_data(task_id) -> AsyncGenerator:
        datas = ""
        index = 0
        async for data in crud.data.query(task_id=task_id):
            index += 1
            datas += schemas.data.DoData.parse_obj(data).json(ensure_ascii=False) + "\n"

            if index % 100 == 0:
                yield datas
                datas = ""

        if datas:
            yield datas

    resp = StreamingResponse(
        content=export_stream_data(task_id),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M')}.jsonl"
        },
    )

    return resp


@router.get(
    "/record/export",
    summary="导出标注记录",
    description="导出标注记录",
    response_class=StreamingResponse,
)
async def export_record(
    task_id: UUID,
):
    task = await crud.audit_task.query(task_id=task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    user_name_map = defaultdict(str)
    async for user in crud.user.query():
        user_name_map[user.user_id] = user.name

    async def export_stream_data(task_id) -> AsyncGenerator:
        records = ""
        index = 0
        async for record in crud.record.query(task_id=task_id, is_submit=True):
            index += 1
            do_record = schemas.record.DoRecord.parse_obj(record)
            record_dict = do_record.dict()
            record_dict["creator"] = user_name_map[do_record.creator_id]
            records += orjson.dumps(record_dict).decode("utf-8") + "\n"

            if index % 100 == 0:
                yield records
                records = ""

        if records:
            yield records

    resp = StreamingResponse(
        content=export_stream_data(task_id),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M')}.jsonl"
        },
    )

    return resp


@router.get(
    "/data/export_workload",
    summary="导出工作量",
    description="导出工作量",
    response_class=Response,
)
async def export_workload(
    task_id: UUID,
):
    task = await crud.audit_task.query(task_id=task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    flows = await crud.audit_flow.query(task_id=task_id).to_list()

    # 用户答题总数
    user_data_count: defaultdict = defaultdict(int)
    # 用户答题总时长（秒）
    user_data_duration: defaultdict = defaultdict(int)
    # 用户被采纳的答题总数
    user_data_passed_count: defaultdict = defaultdict(int)
    # 用户被拒绝的答题总数
    user_data_rejected_count: defaultdict = defaultdict(int)
    # 用户id set
    user_ids: set = set()

    async for record in crud.record.query(task_id=task_id, is_submit=True):
        user_ids.add(record.creator_id)
        user_data_count[f"{record.flow_index}_{record.creator_id}"] += 1
        user_data_duration[f"{record.flow_index}_{record.creator_id}"] += (
            (record.submit_time - record.create_time) if record.submit_time else 0
        )
        if record.status == schemas.record.RecordStatus.COMPLETED:
            user_data_passed_count[f"{record.flow_index}_{record.creator_id}"] += 1
        elif record.status == schemas.record.RecordStatus.DISCARDED:
            user_data_rejected_count[f"{record.flow_index}_{record.creator_id}"] += 1

    users = await crud.user.query(user_id=list(user_ids)).to_list()
    user_name_map = {user.user_id: user.name for user in users}

    teams = await crud.team.query(user_id=[user.user_id for user in users]).to_list()
    user_teams: defaultdict = defaultdict(list)
    for team in teams:
        for t_user in team.users:
            user_teams[t_user.user_id].append(team.name)
    colummns: list[list[str]] = []

    for index, flow in enumerate(flows):
        colummns.append([f"第{index+1}轮"])
        colummns.append(
            [
                "用户ID",
                "用户名",
                "所属团队",
                "审题效率（题/小时）",
                "审题时长（小时）",
                "审题数",
                "判题结果被采纳的题数",
                "判题结果未被采纳的题数",
                "未采纳率",
            ]
        )
        for user_id in user_ids:
            if f"{flow.index}_{user_id}" in user_data_duration:
                colummns.append(
                    [
                        user_id,
                        user_name_map[user_id] if user_id in user_name_map else "",
                        ",".join(user_teams[user_id]) if user_id in user_teams else "",
                        f"{(user_data_count[f'{flow.index}_{user_id}'] / user_data_duration[f'{flow.index}_{user_id}'] * 60 * 60):.2f}",
                        f"{(user_data_duration[f'{flow.index}_{user_id}']/60/60):.4f}",
                        user_data_count[f"{flow.index}_{user_id}"],
                        user_data_passed_count[f"{flow.index}_{user_id}"],
                        user_data_rejected_count[f"{flow.index}_{user_id}"],
                        f"{(user_data_rejected_count[f'{flow.index}_{user_id}']/user_data_count[f'{flow.index}_{user_id}']*100):.2f}%",
                    ]
                )
        colummns.append([])

    # 生成excel
    wb = Workbook()
    ws = wb.active
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
    "/record/group/user",
    summary="数据统计-用户维度",
    description="数据统计-用户维度",
    response_model=schemas.operator.task.RespGroupRecordByUser,
)
async def group_record_by_user(
    req: schemas.operator.task.ReqGroupAuditRecordByUser = Body(...),
):
    if req.username is not None:
        users = await crud.user.query(name=req.username).to_list()
        user_ids = [user.user_id for user in users]
    else:
        user_ids = None

    aggregate_res = (
        await crud.record.query(
            user_id=user_ids,
            task_id=req.task_id,
            flow_index=req.flow_index,
            is_submit=True,
        )
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
        await crud.record.query(
            user_id=user_ids,
            task_id=req.task_id,
            flow_index=req.flow_index,
            is_submit=True,
        )
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
    req: schemas.operator.task.ReqPreviewAuditRecord = Body(...),
):
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    # 这是为了看审核工具配置, 采用一条伪造的数据
    if req.user_id is None:
        return get_audit_review_record()

    records = (
        await crud.record.query(
            task_id=task.task_id,
            user_id=req.user_id,
            status=req.record_status,
            is_submit=True,
            flow_index=req.flow_index,
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
            schemas.message.MessageBase.parse_obj(message)
            for message in data.conversation
        ],
        evaluation=schemas.evaluation.SingleEvaluation(
            message_evaluation=data.evaluation.message_evaluation,
            conversation_evaluation=data.evaluation.conversation_evaluation,
            questionnaire_evaluation=data.evaluation.questionnaire_evaluation,
            data_evaluation=(
                record.evaluation.data_evaluation[0]
                if record.evaluation and record.evaluation.data_evaluation
                else None
            ),
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
    req: schemas.operator.task.ReqAuditRecordList = Body(...),
):
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    total = await crud.record.query(
        task_id=task.task_id,
        user_id=req.user_id,
        status=req.status,
        is_submit=True,
        flow_index=req.flow_index,
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
