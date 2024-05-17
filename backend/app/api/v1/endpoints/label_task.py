import time
from collections import defaultdict

import sentry_sdk
from fastapi import APIRouter, Body, Depends

from app import crud, models, schemas
from app.api import deps
from app.core import exceptions

router = APIRouter(prefix="/task/label", tags=["label_task"])


@router.post(
    "/list",
    summary="获取标注任务列表",
    description="获取标注任务列表",
    response_model=schemas.task.RespListTask,
)
async def list_label_task(
    req: schemas.task.ReqListTask = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.task.RespListTask:
    with sentry_sdk.start_transaction(op="task", name="list label task"):
        with sentry_sdk.start_span(description="get teams"):
            teams = await crud.team.query(user_id=user.user_id).to_list()
            if not teams:
                raise exceptions.SERVER_ERROR

        team_ids = [team.team_id for team in teams]

        with sentry_sdk.start_span(description="get task total"):
            total = await crud.label_task.query(
                status=[schemas.task.TaskStatus.OPEN, schemas.task.TaskStatus.DONE],
                team_id=team_ids,
            ).count()
        if total == 0:
            resp = schemas.task.RespListTask(list=[], total=0)
            return resp

        if req.page_size == 0:
            resp = schemas.task.RespListTask(list=[], total=total)
            return resp
        with sentry_sdk.start_span(description="get tasks"):
            tasks = await crud.label_task.query(
                status=[schemas.task.TaskStatus.OPEN, schemas.task.TaskStatus.DONE],
                team_id=team_ids,
                skip=(req.page - 1) * req.page_size,
                limit=req.page_size,
                sort=["-create_time"],
            ).to_list()
        if not tasks:
            raise exceptions.SERVER_ERROR

        # 统计任务进度
        # 任务id
        task_ids = [task.task_id for task in tasks]
        # 未结束的任务id
        open_task_ids = [
            task.task_id
            for task in tasks
            if task.status == schemas.task.TaskStatus.OPEN
        ]
        # 已完成的题数
        completed_count_map: defaultdict = defaultdict(int)
        # 剩余的题数
        remain_count_map: defaultdict = defaultdict(int)
        # 已完成的题目id
        questionnaire_ids_set = set()

        # 已提交的记录
        with sentry_sdk.start_span(description="get submit record"):
            async for record in crud.record.query(
                task_id=task_ids,
                user_id=user.user_id,
                is_submit=True,
            ):
                completed_count_map[record.task_id] += 1
                questionnaire_ids_set.add(record.questionnaire_id)

        # 待提交的记录
        with sentry_sdk.start_span(description="get not submit record"):
            async for record in crud.record.query(
                task_id=open_task_ids,
                user_id=user.user_id,
                is_submit=False,
            ):
                remain_count_map[record.task_id] += 1
                questionnaire_ids_set.add(record.questionnaire_id)

        # 统计剩余题数
        with sentry_sdk.start_span(description="count task remain"):
            async for task_remain in crud.data.query(
                task_id=open_task_ids,
                status=schemas.data.DataStatus.PENDING,
            ).aggregate(
                [
                    {
                        "$group": {
                            "_id": {
                                "task_id": "$task_id",
                                "questionnaire_id": "$questionnaire_id",
                            },
                        }
                    },
                    {
                        "$group": {
                            "_id": "$_id.task_id",
                            "remain": {"$sum": 1},
                        }
                    },
                ],
                projection_model=schemas.task.ViewTaskRemain,
            ):
                remain_count_map[task_remain.task_id] += task_remain.remain

        # 把已经做过的题目从剩余题数中减去
        with sentry_sdk.start_span(description="count has done task remain"):
            async for task_remain in crud.data.query(
                task_id=open_task_ids,
                questionnaire_id=list(questionnaire_ids_set),
                status=schemas.data.DataStatus.PENDING,
            ).aggregate(
                [
                    {
                        "$group": {
                            "_id": {
                                "task_id": "$task_id",
                                "questionnaire_id": "$questionnaire_id",
                            },
                        }
                    },
                    {
                        "$group": {
                            "_id": "$_id.task_id",
                            "remain": {"$sum": 1},
                        }
                    },
                ],
                projection_model=schemas.task.ViewTaskRemain,
            ):
                remain_count_map[task_remain.task_id] -= task_remain.remain

        resp = schemas.task.RespListTask(
            list=[
                schemas.task.ListTaskBase(
                    task_id=task.task_id,
                    title=task.title,
                    description=task.description,
                    status=task.status,
                    remain_count=remain_count_map[task.task_id],
                    completed_count=completed_count_map[task.task_id],
                )
                for task in tasks
            ],
            total=total,
        )
        return resp


@router.post(
    "/detail",
    summary="获取标注任务详情",
    description="获取标注任务详情",
    response_model=schemas.task.RespGetLabelTask,
)
async def get_label_task(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.task.RespGetLabelTask:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    teams = await crud.team.query(user_id=user.user_id).to_list()
    if not teams:
        raise exceptions.SERVER_ERROR

    team_ids = [team.team_id for team in teams]

    if len(set(team_ids).intersection(set(task.teams))) == 0:
        raise exceptions.USER_PERMISSION_DENIED

    resp = schemas.task.RespGetLabelTask(
        task_id=task.task_id,
        title=task.title,
        description=task.description,
        label_tool_config=task.tool_config,
    )

    return resp


@router.post(
    "/data/get",
    summary="获取数据",
    description="获取数据",
    response_model=schemas.data.RespGetData,
)
async def get_data(
    req: schemas.task.DoTaskBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> schemas.data.RespGetData:
    # 看任务是否存在
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    # 检查用户是否有权限
    teams = await crud.team.query(user_id=user.user_id).to_list()
    if not teams:
        raise exceptions.SERVER_ERROR

    team_ids = [team.team_id for team in teams]
    if len(set(team_ids).intersection(set(task.teams))) == 0:
        raise exceptions.USER_PERMISSION_DENIED

    # 获取用户未完成的数据
    record = await crud.record.query(
        task_id=req.task_id,
        user_id=user.user_id,
        create_time_gt=int(time.time()) - task.expire_time,
        is_submit=False,
    ).first_or_none()

    # 如果有未完成的数据，返回
    if record:
        data = await crud.data.query(data_id=record.data_id).first_or_none()
        if not data:
            raise exceptions.SERVER_ERROR

        return schemas.data.RespGetData(
            questionnaire_id=data.questionnaire_id,
            data_id=data.data_id,
            prompt=data.prompt,
            conversation=[
                schemas.message.MessageBase.parse_obj(message)
                for message in data.conversation
            ],
            reference_evaluation=data.reference_evaluation,
            remain_time=task.expire_time + record.create_time,
        )

    # 获取用户已完成的数据
    items = (
        await crud.record.query(
            task_id=req.task_id,
            user_id=user.user_id,
            is_submit=True,
        )
        .project(schemas.task.ViewQuestionnaireID)
        .to_list()
    )

    # 随机获取一个未完成的数据
    datas = (
        await crud.data.query(
            task_id=req.task_id,
            status=schemas.data.DataStatus.PENDING,
            not_questionnaire_id=[item.questionnaire_id for item in items],
        )
        .aggregate(
            [
                {"$sample": {"size": 1}},
            ],
            projection_model=models.data.Data,
        )
        .to_list()
    )
    if not datas:
        raise exceptions.DATA_BALANCE_NOT_ENOUGH

    data = datas[0]
    await crud.data.update(
        db_obj=data,
        obj_in=models.data.DataUpdate(status=schemas.data.DataStatus.PROCESSING),
    )
    record = await crud.record.create(
        obj_in=models.record.RecordCreate(
            data_id=data.data_id,
            task_id=data.task_id,
            questionnaire_id=data.questionnaire_id,
            creator_id=user.user_id,
        )
    )
    resp = schemas.data.RespGetData(
        questionnaire_id=data.questionnaire_id,
        data_id=data.data_id,
        prompt=data.prompt,
        conversation=[
            schemas.message.MessageBase.parse_obj(message)
            for message in data.conversation
        ],
        reference_evaluation=data.reference_evaluation,
        remain_time=task.expire_time + record.create_time,
    )

    return resp


@router.post(
    "/data/release",
    summary="释放数据",
    description="释放数据",
)
async def release_data(
    req: schemas.data.DoDataBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> None:
    data = await crud.data.query(data_id=req.data_id).first_or_none()
    if not data:
        raise exceptions.DATA_NOT_EXIST

    task = await crud.label_task.query(task_id=data.task_id).first_or_none()
    if not task:
        raise exceptions.SERVER_ERROR

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_IS_DONE

    record = await crud.record.query(
        data_id=req.data_id,
        user_id=user.user_id,
        is_submit=False,
        create_time_gt=int(time.time()) - task.expire_time,
    ).first_or_none()
    if not record:
        raise exceptions.DATA_NOT_BELONG_TO_USER

    await crud.record.remove(record.id)
    await crud.data.update(
        db_obj=data,
        obj_in=models.data.DataUpdate(status=schemas.data.DataStatus.PENDING),
    )


@router.put(
    "/data/commit",
    summary="提交数据",
    description="提交数据",
)
async def commit_data(
    req: schemas.data.ReqCommitData = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
) -> None:
    data = await crud.data.query(data_id=req.data_id).first_or_none()
    if not data:
        raise exceptions.DATA_NOT_EXIST

    task = await crud.label_task.query(task_id=data.task_id).first_or_none()
    if not task:
        raise exceptions.SERVER_ERROR

    if task.status != schemas.task.TaskStatus.OPEN:
        raise exceptions.TASK_STATUS_NOT_ALLOW

    record = await crud.record.query(
        data_id=req.data_id,
        user_id=user.user_id,
        is_submit=False,
        create_time_gt=int(time.time()) - task.expire_time,
    ).first_or_none()
    if not record:
        raise exceptions.DATA_NOT_BELONG_TO_USER

    evaluation = data.evaluation
    evaluation.message_evaluation = req.message_evaluation
    evaluation.conversation_evaluation = req.conversation_evaluation
    evaluation.questionnaire_evaluation = req.questionnaire_evaluation

    await crud.data.update(
        db_obj=data,
        obj_in=models.data.DataUpdate(
            status=schemas.data.DataStatus.COMPLETED, evaluation=evaluation
        ),
    )
    await crud.record.update(
        db_obj=record,
        obj_in=models.record.RecordUpdate(
            submit_time=int(time.time()),
            evaluation=evaluation,
            status=schemas.record.RecordStatus.COMPLETED,
        ),
    )
