import time
from uuid import UUID
from collections import defaultdict

import sentry_sdk
from pydantic import BaseModel
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
        questionnaire_ids_map = {i.task_id: set() for i in tasks}

        # 已提交的记录
        with sentry_sdk.start_span(description="get submit record"):
            async for record in crud.record.query(
                task_id=task_ids,
                user_id=user.user_id,
                is_submit=True,
            ):
                completed_count_map[record.task_id] += 1
                questionnaire_ids_map[record.task_id].add(record.questionnaire_id)

        # 待提交的记录
        with sentry_sdk.start_span(description="get not submit record"):
            async for record in crud.record.query(
                task_id=open_task_ids,
                user_id=user.user_id,
                is_submit=False,
            ):
                remain_count_map[record.task_id] += 1
                questionnaire_ids_map[record.task_id].add(record.questionnaire_id)

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
        for task in tasks:
            async for task_remain in crud.data.query(
                task_id=task.task_id,
                questionnaire_id=list(questionnaire_ids_map[task.task_id]),
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
                schemas.message.MessageBase.model_validate(
                    message, from_attributes=True
                )
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
            schemas.message.MessageBase.model_validate(message, from_attributes=True)
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


@router.post(
    "/user",
    summary="获取标注任务用户",
    description="获取标注任务用户",
)
async def get_task_user(
    req: schemas.task.DoTaskKindBase = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
    teams: list[models.team.Team] = Depends(deps.get_current_team),
) -> schemas.user.ListUserTaskResp:
    class UserField(BaseModel):
        creator_id: str

    # 获取团队用户信息
    team_user_ids = []
    for team in teams:
        team_user_ids.extend([user.user_id for user in team.users])

    if req.inlet == schemas.task.PreviewDataKind.USER:
        user_ids = [user.user_id]
    elif req.inlet == schemas.task.PreviewDataKind.SUPPLIER:
        records = (
            await crud.record.query(
                task_id=req.task_id,
                is_submit=True,
            )
            .project(
                UserField,
            )
            .to_list()
        )
        user_ids = list(
            set([record.creator_id for record in records]) & set(team_user_ids)
        )
    elif req.inlet == schemas.task.PreviewDataKind.OPERATOR:
        records = (
            await crud.record.query(
                task_id=req.task_id,
                is_submit=True,
            )
            .project(
                UserField,
            )
            .to_list()
        )
        user_ids = [record.creator_id for record in records]
    else:
        raise exceptions.SERVER_ERROR

    users = await crud.user.query(user_id=user_ids).to_list()

    return schemas.user.ListUserTaskResp(
        list=[
            schemas.user.DoUserWithUsername(
                user_id=user.user_id,
                username=user.name,
            )
            for user in users
        ],
        total=len(users),
    )


async def get_record_ids(
    req: schemas.task.ReqPreviewRecord,
    teams: list[models.team.Team],
    user: schemas.user.DoUser,
):
    # 获取团队用户信息
    class DataField(BaseModel):
        data_id: UUID

    team_user_ids = []
    for team in teams:
        team_user_ids.extend([user.user_id for user in team.users])

    if req.inlet == schemas.task.PreviewDataKind.USER:
        user_ids = [user.user_id]
        records = (
            await crud.record.query(
                task_id=req.task_id,
                user_id=user_ids,
                is_submit=True,
            )
            .project(
                DataField,
            )
            .to_list()
        )
    elif req.inlet == schemas.task.PreviewDataKind.SUPPLIER:
        records = (
            await crud.record.query(
                task_id=req.task_id,
                is_submit=True,
                user_id=team_user_ids,
            )
            .project(
                DataField,
            )
            .to_list()
        )
    elif req.inlet == schemas.task.PreviewDataKind.OPERATOR and user.role in (
        schemas.user.UserType.ADMIN,
        schemas.user.UserType.SUPER_ADMIN,
    ):
        records = (
            await crud.record.query(
                task_id=req.task_id,
                is_submit=True,
            )
            .project(
                DataField,
            )
            .to_list()
        )
    else:
        raise exceptions.SERVER_ERROR

    return [record.data_id for record in records]


@router.post(
    "/record/preview",
    summary="预览记录",
    description="预览记录",
    response_model=schemas.operator.task.RespPreviewRecord,
)
async def preview_record(
    req: schemas.task.ReqPreviewRecord = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
    teams: list[models.team.Team] = Depends(deps.get_current_team),
):
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    record_ids = await get_record_ids(req, teams, user)
    if req.data_id:
        data_id = list(set(record_ids) & set([req.data_id]))
    else:
        data_id = record_ids

    records = (
        await crud.record.query(
            task_id=task.task_id,
            user_id=req.user_id,
            data_id=data_id,
            status=req.record_status,
            is_submit=True,
        )
        .aggregate(
            [
                {"$sort": {"submit_time": -1}},
                {"$limit": 1},
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

    label_user = await crud.user.query(user_id=record.creator_id).first_or_none()

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
            username=label_user.name if label_user else "",
        ),
        status=data.status,
    )

    return resp


@router.post(
    "/record/preview/ids",
    summary="获取预览数据 id",
    description="预览数据 id",
    response_model=schemas.task.RespPreviewDataID,
)
async def preview_data_ids(
    req: schemas.task.ReqPreviewDataID = Body(...),
    user: schemas.user.DoUser = Depends(deps.get_current_user),
    teams: list[models.team.Team] = Depends(deps.get_current_team),
) -> schemas.task.RespPreviewDataID:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    class TaskField(BaseModel):
        data_id: UUID

    record_ids = await get_record_ids(req, teams, user)

    records = (
        await crud.record.query(
            task_id=task.task_id,
            user_id=req.user_id,
            status=req.record_status,
            data_id=record_ids,
            is_submit=True,
        )
        .aggregate(
            [
                {"$sort": {"submit_time": -1}},
            ],
            projection_model=TaskField,
        )
        .to_list()
    )

    data_id = None
    if req.pos_locate == schemas.task.RecordPosLocateKind.CURRENT:
        if records:
            data_id = records[0].data_id
    elif req.pos_locate == schemas.task.RecordPosLocateKind.NEXT:
        stop = False
        for record in records:
            if stop:
                data_id = record.data_id
                break
            if record.data_id == req.data_id:
                stop = True
    elif req.pos_locate == schemas.task.RecordPosLocateKind.PRE:
        for record in records:
            if record.data_id == req.data_id:
                break
            data_id = record.data_id
    return schemas.task.RespPreviewDataID(
        data_id=data_id,
        task_id=task.task_id,
    )
