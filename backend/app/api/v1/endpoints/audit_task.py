import time
from collections import defaultdict

from beanie.operators import Push
from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions
from app.util import sample

router = APIRouter(prefix="/task/audit", tags=["audit_task"])


@router.post(
    "/list",
    summary="获取审核任务列表",
    description="获取审核任务列表",
    response_model=schemas.task.RespListAuditTask,
)
async def list_audit_task(
    req: schemas.task.ReqListTask = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    teams = await crud.team.query(
        user_id=user.user_id,
    ).to_list()
    if not teams:
        raise exceptions.SERVER_ERROR

    team_ids = [team.team_id for team in teams]

    tasks = await crud.audit_task.query(
        status=[schemas.task.TaskStatus.OPEN, schemas.task.TaskStatus.DONE],
    ).to_list()
    task_ids = [task.task_id for task in tasks]
    task_map = {task.task_id: task for task in tasks}

    total = await crud.audit_flow.query(task_id=task_ids, team_id=team_ids).count()
    if total == 0:
        resp = schemas.task.RespListAuditTask(list=[], total=0)
        return resp

    if req.page_size == 0:
        resp = schemas.task.RespListAuditTask(list=[], total=total)
        return resp

    flows = await crud.audit_flow.query(
        task_id=task_ids,
        team_id=team_ids,
        skip=(req.page - 1) * req.page_size,
        limit=req.page_size,
        sort=["-create_time"],
    ).to_list()
    if not flows:
        raise exceptions.SERVER_ERROR

    # 统计任务进度
    # 所见流程的任务id
    task_ids = list(set([flow.task_id for flow in flows]))
    # 未结束的任务id
    open_task_ids = list(
        set(
            [
                flow.task_id
                for flow in flows
                if task_map[flow.task_id].status == schemas.task.TaskStatus.OPEN
            ]
        )
    )

    # 已完成的题数
    completed_count_map: defaultdict = defaultdict(int)
    # 剩余的题数
    remain_count_map: defaultdict = defaultdict(int)
    # 已完成的数据id
    data_ids = []

    # 已提交的记录
    async for record in crud.record.query(
        task_id=task_ids,
        user_id=user.user_id,
        is_submit=True,
    ):
        completed_count_map[f"{record.task_id}_{record.flow_index}"] += 1
        data_ids.append(record.data_id)

    # 待提交的记录
    async for record in crud.record.query(
        task_id=open_task_ids,
        user_id=user.user_id,
        is_submit=False,
    ):
        remain_count_map[f"{record.task_id}_{record.flow_index}"] += 1
        data_ids.append(record.data_id)

    # 统计剩余题数
    async for data in crud.audit_flow_data.query(
        task_id=open_task_ids,
        status=schemas.data.FlowDataStatus.PENDING,
    ).aggregate(
        [
            {
                "$group": {
                    "_id": {
                        "task_id": "$task_id",
                        "index": "$index",
                    },
                    "remain": {"$sum": 1},
                }
            }
        ],
        projection_model=schemas.task.ViewAuditTaskRemain,
    ):
        remain_count_map[f"{data.view_id.task_id}_{data.view_id.index}"] += data.remain

    # 把已经做过的题目从剩余题数中减去
    async for data in crud.audit_flow_data.query(
        task_id=open_task_ids,
        status=schemas.data.FlowDataStatus.PENDING,
        data_id=data_ids,
    ).aggregate(
        [
            {
                "$group": {
                    "_id": {
                        "task_id": "$task_id",
                        "index": "$index",
                    },
                    "remain": {"$sum": 1},
                }
            }
        ],
        projection_model=schemas.task.ViewAuditTaskRemain,
    ):
        remain_count_map[f"{data.view_id.task_id}_{data.view_id.index}"] -= data.remain

    resp = schemas.task.RespListAuditTask(
        list=[
            schemas.task.ListAuditTaskBase(
                task_id=flow.task_id,
                flow_index=flow.index,
                title=task_map[flow.task_id].title,
                description=task_map[flow.task_id].description,
                status=task_map[flow.task_id].status,
                remain_count=remain_count_map[f"{flow.task_id}_{flow.index}"],
                completed_count=completed_count_map[f"{flow.task_id}_{flow.index}"],
            )
            for flow in flows
        ],
        total=total,
    )

    return resp


@router.post(
    "/detail",
    summary="获取审核任务详情",
    description="获取审核任务详情",
    response_model=schemas.task.RespGetAuditTask,
)
async def get_audit_task(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    teams = await crud.team.query(user_id=user.user_id).to_list()
    if not teams:
        raise exceptions.SERVER_ERROR

    team_ids = [team.team_id for team in teams]

    flows = await crud.audit_flow.query(
        task_id=task.task_id,
        team_id=team_ids,
    ).to_list()
    if not flows:
        raise exceptions.USER_PERMISSION_DENIED

    target_task = await crud.label_task.query(
        task_id=task.target_task_id
    ).first_or_none()
    if not target_task:
        raise exceptions.SERVER_ERROR

    resp = schemas.task.RespGetAuditTask(
        task_id=task.task_id,
        title=task.title,
        description=task.description,
        audit_tool_config=task.tool_config,
        label_tool_config=target_task.tool_config,
    )

    return resp


@router.post(
    "/data/get",
    summary="获取数据",
    description="获取数据",
    response_model=schemas.data.RespGetAuditData,
)
async def get_data(
    req: schemas.task.ReqGetAuditTaskData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
):
    task = await crud.audit_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    teams = await crud.team.query(user_id=user.user_id).to_list()
    if not teams:
        raise exceptions.SERVER_ERROR

    team_ids = [team.team_id for team in teams]

    flow = await crud.audit_flow.query(
        task_id=task.task_id,
        team_id=team_ids,
        index=req.flow_index,
    ).first_or_none()
    if not flow:
        raise exceptions.USER_PERMISSION_DENIED

    # 获取用户未完成的数据
    record = await crud.record.query(
        task_id=req.task_id,
        user_id=user.user_id,
        create_time_gt=int(time.time()) - flow.expire_time,
        is_submit=False,
        flow_index=flow.index,
    ).first_or_none()

    # 如果有未完成的数据，返回
    if record:
        data = await crud.data.query(data_id=record.data_id).first_or_none()
        if not data:
            raise exceptions.SERVER_ERROR

        return schemas.data.RespGetAuditData(
            questionnaire_id=data.questionnaire_id,
            data_id=data.data_id,
            prompt=data.prompt,
            conversation=[
                schemas.message.MessageBase.parse_obj(message)
                for message in data.conversation
            ],
            evaluation=data.evaluation,
            remain_time=flow.expire_time + record.create_time,
        )

    # 获取用户已完成的数据
    items = (
        await crud.record.query(
            task_id=req.task_id,
            user_id=user.user_id,
            is_submit=True,
        )
        .project(schemas.task.ViewDataID)
        .to_list()
    )

    # 随机获取一个未完成的数据
    flow_datas = (
        await crud.audit_flow_data.query(
            task_id=req.task_id,
            index=req.flow_index,
            status=schemas.data.FlowDataStatus.PENDING,
            not_data_id=[item.data_id for item in items],
        )
        .aggregate(
            [
                {"$sample": {"size": 1}},
            ],
            projection_model=models.audit_task.AuditFlowData,
        )
        .to_list()
    )
    if not flow_datas:
        raise exceptions.DATA_BALANCE_NOT_ENOUGH

    flow_data = flow_datas[0]
    data = await crud.data.query(data_id=flow_data.data_id).first_or_none()
    if not data:
        raise exceptions.SERVER_ERROR
    await crud.audit_flow_data.update(
        db_obj=flow_data,
        obj_in=models.audit_task.AuditFlowDataUpdate(
            status=schemas.data.FlowDataStatus.PROCESSING,
        ),
    )
    record = await crud.record.create(
        obj_in=models.record.RecordCreate(
            task_id=req.task_id,
            data_id=flow_data.data_id,
            creator_id=user.user_id,
            flow_index=flow.index,
            questionnaire_id=data.questionnaire_id,
        )
    )

    resp = schemas.data.RespGetAuditData(
        questionnaire_id=data.questionnaire_id,
        data_id=data.data_id,
        prompt=data.prompt,
        conversation=[
            schemas.message.MessageBase.parse_obj(message)
            for message in data.conversation
        ],
        evaluation=data.evaluation,
        remain_time=flow.expire_time + record.create_time,
    )

    return resp


@router.post(
    "/data/release",
    summary="释放数据",
    description="释放数据",
)
async def release_data(
    req: schemas.data.ReqReleaseAuditData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> None:
    data = await crud.data.query(data_id=req.data_id).first_or_none()
    if not data:
        raise exceptions.DATA_NOT_EXIST

    task = await crud.audit_task.query(task_id=data.task_id).first_or_none()
    if not task:
        raise exceptions.SERVER_ERROR

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_IS_DONE

    flow = await crud.audit_flow.query(
        task_id=task.task_id,
        index=req.flow_index,
    ).first_or_none()
    if not flow:
        raise exceptions.TASK_FLOW_NOT_EXIST

    record = await crud.record.query(
        data_id=req.data_id,
        user_id=user.user_id,
        flow_index=flow.index,
        is_submit=False,
        create_time_gt=int(time.time()) - flow.expire_time,
    ).first_or_none()
    if not record:
        raise exceptions.DATA_NOT_BELONG_TO_USER

    flow_data = await crud.audit_flow_data.query(
        task_id=task.task_id,
        index=flow.index,
        data_id=req.data_id,
    ).first_or_none()
    if not flow_data:
        raise exceptions.SERVER_ERROR

    await crud.record.remove(record.id)
    await crud.audit_flow_data.update(
        db_obj=flow_data,
        obj_in=models.audit_task.AuditFlowDataUpdate(
            status=schemas.data.FlowDataStatus.PENDING
        ),
    )

    return


@router.put(
    "/data/commit",
    summary="提交数据",
    description="提交数据",
)
async def commit_data(
    req: schemas.data.ReqCommitAuditData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> None:
    data = await crud.data.query(data_id=req.data_id).first_or_none()
    if not data:
        raise exceptions.DATA_NOT_EXIST

    task = await crud.audit_task.query(task_id=data.task_id).first_or_none()
    if not task:
        raise exceptions.SERVER_ERROR

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    flow = await crud.audit_flow.query(
        task_id=task.task_id,
        index=req.flow_index,
    ).first_or_none()
    if not flow:
        raise exceptions.TASK_FLOW_NOT_EXIST

    record = await crud.record.query(
        data_id=req.data_id,
        user_id=user.user_id,
        is_submit=False,
        create_time_gt=int(time.time()) - flow.expire_time,
        flow_index=flow.index,
    ).first_or_none()
    if not record:
        raise exceptions.DATA_NOT_BELONG_TO_USER

    flow_data = await crud.audit_flow_data.query(
        task_id=task.task_id,
        index=flow.index,
        data_id=req.data_id,
    ).first_or_none()
    if not flow_data:
        raise exceptions.SERVER_ERROR

    evaluation = data.evaluation
    if evaluation.data_evaluation is None:
        evaluation.data_evaluation = [req.data_evaluation]
    else:
        evaluation.data_evaluation.append(req.data_evaluation)

    if req.is_pass:
        flow_data.remain_pass_count -= 1
        flow_data.remain_audit_count -= 1
        flow_data.pass_audit_user_ids.append(user.user_id)
    else:
        flow_data.remain_audit_count -= 1
        flow_data.reject_audit_user_ids.append(user.user_id)

    await crud.record.update(
        db_obj=record,
        obj_in=models.record.RecordUpdate(
            submit_time=int(time.time()),
            evaluation=schemas.evaluation.Evaluation(
                data_evaluation=[req.data_evaluation]
            ),
            status=schemas.record.RecordStatus.COMPLETED,
        ),
    )
    if flow_data.remain_pass_count == 0:
        # 数据通过
        await crud.record.query(
            data_id=req.data_id,
            flow_index=flow.index,
            is_submit=True,
            user_id=flow_data.reject_audit_user_ids,
        ).set(
            {models.record.Record.status: schemas.record.RecordStatus.DISCARDED}
        )  # type: ignore

        await crud.audit_flow_data.update(
            db_obj=flow_data,
            obj_in=models.audit_task.AuditFlowDataUpdate(
                remain_pass_count=flow_data.remain_pass_count,
                remain_audit_count=flow_data.remain_audit_count,
                pass_audit_user_ids=flow_data.pass_audit_user_ids,
                status=schemas.data.FlowDataStatus.COMPLETED,
            ),
        )
        if flow.is_last:
            await crud.data.update(
                db_obj=data,
                obj_in=models.data.DataUpdate(
                    status=schemas.data.DataStatus.COMPLETED, evaluation=evaluation
                ),
            )
        elif not flow.is_last:
            next_flow = await crud.audit_flow.query(
                task_id=task.task_id,
                index=flow.index + 1,
            ).first_or_none()
            if not next_flow:
                raise exceptions.SERVER_ERROR

            await crud.data.update(
                db_obj=data,
                obj_in=models.data.DataUpdate(evaluation=evaluation),
            )

            if len(sample(next_flow.sample_ratio, 1)) > 0:
                # 如果下一轮还没有一条数据，或者抽样抽中该数据。则创建数据！！
                await crud.audit_flow_data.create(
                    obj_in=models.audit_task.AuditFlowDataCreate(
                        task_id=task.task_id,
                        index=flow.index + 1,
                        data_id=req.data_id,
                        remain_audit_count=next_flow.max_audit_count,
                        remain_pass_count=next_flow.pass_audit_count,
                    )
                )
    elif (
        flow_data.remain_audit_count == 0
        or flow_data.remain_audit_count < flow_data.remain_pass_count
    ):
        await crud.record.query(
            data_id=req.data_id,
            flow_index=flow.index,
            is_submit=True,
            user_id=flow_data.pass_audit_user_ids,
        ).set(
            {models.record.Record.status: schemas.record.RecordStatus.DISCARDED}
        )  # type: ignore

        await crud.audit_flow_data.update(
            db_obj=flow_data,
            obj_in=models.audit_task.AuditFlowDataUpdate(
                remain_audit_count=flow_data.remain_audit_count,
                reject_audit_user_ids=flow_data.reject_audit_user_ids,
                status=schemas.data.FlowDataStatus.COMPLETED,
            ),
        )
        await crud.data.update(
            db_obj=data,
            obj_in=models.data.DataUpdate(
                status=schemas.data.DataStatus.DISCARDED, evaluation=evaluation
            ),
        )

        if task.is_data_recreate:
            await task.update(
                Push({models.audit_task.AuditTask.recreate_data_ids: req.data_id})  # type: ignore
            )

    else:
        await crud.data.update(
            db_obj=data,
            obj_in=models.data.DataUpdate(evaluation=evaluation),
        )
        await crud.audit_flow_data.update(
            db_obj=flow_data,
            obj_in=models.audit_task.AuditFlowDataUpdate(
                remain_pass_count=flow_data.remain_pass_count,
                remain_audit_count=flow_data.remain_audit_count,
                pass_audit_user_ids=flow_data.pass_audit_user_ids,
                reject_audit_user_ids=flow_data.reject_audit_user_ids,
                status=schemas.data.FlowDataStatus.PENDING,
            ),
        )
