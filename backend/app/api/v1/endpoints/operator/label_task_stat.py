import json
import tempfile
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Union
from uuid import UUID

from fastapi import APIRouter, Body
from fastapi.responses import Response, StreamingResponse
from openpyxl import Workbook

from app import crud, schemas
from app.core import exceptions
from app.util.stats import (
    ExportFilterLabelIDWithoutDupProjectModel,
    ExportFilterLabelTaskProjectModel,
    build_agg_choice_count,
    build_download_stats_id,
    build_filter_query,
    extract_choice_config,
    filter_questionnaire,
)

router = APIRouter(prefix="/task/label")


@router.post(
    "/stats",
    summary="标注任务数据分布",
    description="标志任务数据分布",
    response_model=schemas.operator.stats.RespStatsLabelTask,
)
async def stats_label_task(
    req: schemas.operator.stats.ReqStatsLabelTask = Body(...),
) -> schemas.operator.stats.RespStatsLabelTask:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST
    tool_config = task.tool_config

    total_count = await crud.record.query(
        task_id=req.task_id,
        status=schemas.record.RecordStatus.COMPLETED,
    ).count()

    records: list[schemas.operator.stats.StatsLabelTaskQuestion] = []
    for v in extract_choice_config(tool_config, req.scope):
        choices = []
        for option in v.get("options", []):
            choices.append(
                schemas.operator.stats.StatsLabelTaskChoice(
                    label=option.get("label", "unknown"),
                    value=option.get("value", "unknown"),
                    count=0,
                    total=total_count,
                    id=option.get("id", "unknown"),
                )
            )
        question_kind = schemas.operator.stats.CHOICE_KIND.ENUM
        if v["type"] == schemas.operator.stats.CHOICE_KIND.ARRAY:
            question_kind = schemas.operator.stats.CHOICE_KIND.ARRAY

        for res in (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_agg_choice_count(req.scope, question_kind, v["value"]),
                projection_model=schemas.operator.stats.StatsLabelTaskProjectModel,
            )
            .to_list()
        ):
            if res.value is None:
                continue
            for idx, option in enumerate(v.get("options", [])):
                if option.get("value", "") == res.value:
                    choices[idx] = schemas.operator.stats.StatsLabelTaskChoice(
                        label=option.get("label", "unknown"),
                        value=res.value,
                        count=res.count,
                        total=total_count,
                        id=option.get("id", "unknown"),
                    )
                    break
        records.append(
            schemas.operator.stats.StatsLabelTaskQuestion(
                label=v.get("label", "unknown"),
                value=v.get("value", ""),
                data=choices,
                id=v.get("id", "unknown"),
            )
        )

    return schemas.operator.stats.RespStatsLabelTask(
        _id=req.task_id,
        scope=req.scope,
        data=records,
    )


@router.get(
    "/stats/export",
    summary="导出选项统计数据",
    description="导出选项统计数据",
    response_class=StreamingResponse,
)
async def export_record(
    task_id: UUID,
    scope: schemas.operator.stats.ANSWER_SCOPE,
    question_value: str,
    choice_value: str,
):
    task = await crud.label_task.query(task_id=task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    tool_config = task.tool_config
    question_kind = schemas.operator.stats.CHOICE_KIND.ENUM
    for v in extract_choice_config(tool_config, scope):
        if v.get("value", "") == question_value:
            if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ARRAY:
                question_kind = schemas.operator.stats.CHOICE_KIND.ARRAY
    # 生成excel
    wb = Workbook()
    sheet = wb.active
    sheet.append(["Questionnaire_id", "Data_id", "Custom"])

    for v in (
        await crud.data.query(
            task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
        )
        .aggregate(
            build_download_stats_id(scope, question_kind, question_value, choice_value),
            projection_model=schemas.operator.stats.ExportStatsLabelTaskIDProjectModel,
        )
        .to_list()
    ):
        custom_id = ""
        if len(v.custom_id) > 0:
            custom_id = v.custom_id[0]

        sheet.append([str(v.questionnaire_id), str(v.data_id), custom_id])
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


@router.get(
    "/stats/data",
    summary="选项统计数据",
    description="选项统计数据",
    response_model=schemas.operator.stats.StatsLabelTaskIDProjectModel,
)
async def data_record(
    task_id: UUID,
    scope: schemas.operator.stats.ANSWER_SCOPE,
    question_value: str,
    choice_value: str,
):
    task = await crud.label_task.query(task_id=task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    tool_config = task.tool_config
    question_kind = schemas.operator.stats.CHOICE_KIND.ENUM
    for v in extract_choice_config(tool_config, scope):
        if v.get("value", "") == question_value:
            if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ARRAY:
                question_kind = schemas.operator.stats.CHOICE_KIND.ARRAY

    res: list[schemas.operator.stats.ExportStatsLabelTaskIDProjectModel] = []

    for v in (
        await crud.data.query(
            task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
        )
        .aggregate(
            build_download_stats_id(scope, question_kind, question_value, choice_value),
            projection_model=schemas.operator.stats.ExportStatsLabelTaskIDProjectModel,
        )
        .to_list()
    ):
        res.append(
            schemas.operator.stats.ExportStatsLabelTaskIDProjectModel(
                data_id=v.data_id,
                questionnaire_id=v.questionnaire_id,
                custom_id=v.custom_id,
            )
        )

    return schemas.operator.stats.StatsLabelTaskIDProjectModel(data=res)


@router.post(
    "/filters",
    summary="条件筛选标注结果",
    description="条件筛选标注结果",
    response_model=schemas.operator.stats.RespFilterAnswer,
)
async def filter_label_task(
    req: schemas.operator.stats.ReqFilterAnswer = Body(...),
) -> schemas.operator.stats.RespFilterAnswer:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    for i in range(len(req.filters)):
        filter_opt = req.filters[i]
        for v in extract_choice_config(task.tool_config, filter_opt.scope):
            if v.get("value", "") == filter_opt.question:
                if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ENUM:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ENUM
                else:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ARRAY

    if req.kind == schemas.operator.stats.ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:
        res: list[ExportFilterLabelIDWithoutDupProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelIDWithoutDupProjectModel,
            )
            .to_list()
        )
        dedup_h = {}
        for v in res:
            dedup_h[str(v.data.data_id)] = 1
        return schemas.operator.stats.RespFilterAnswer(count=len(dedup_h))
    else:
        res2: list[ExportFilterLabelTaskProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelTaskProjectModel,
            )
            .to_list()
        )

        dedup_h = {}
        for r in filter_questionnaire(req.operator, req.filters, res2):
            dedup_h[str(r.questionnaire_id)] = 1
        return schemas.operator.stats.RespFilterAnswer(count=len(dedup_h))


@router.get(
    "/filters/id/export",
    summary="下载标注 ID",
    description="下载标注 ID",
    response_class=StreamingResponse,
)
async def export_label_id(params: str):
    req = schemas.operator.stats.ReqFilterAnswer.model_validate(json.loads(params))
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    # 生成excel
    wb = Workbook()
    sheet = wb.active
    sheet.append(["Questionnaire_id", "Data_id", "Custom"])

    for i in range(len(req.filters)):
        filter_opt = req.filters[i]
        for v in extract_choice_config(task.tool_config, filter_opt.scope):
            if v.get("value", "") == filter_opt.question:
                if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ENUM:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ENUM
                else:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ARRAY

    if req.kind == schemas.operator.stats.ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:
        res: list[ExportFilterLabelIDWithoutDupProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelIDWithoutDupProjectModel,
            )
            .to_list()
        )
        dedup_h = {}
        for v in res:
            if str(v.data.data_id) in dedup_h:
                continue
            dedup_h[str(v.data.data_id)] = 1
            custom_id = v.data.custom.get("id", "")
            sheet.append([str(v.data.questionnaire_id), str(v.data.data_id), custom_id])
    else:
        res2: list[ExportFilterLabelTaskProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelTaskProjectModel,
            )
            .to_list()
        )
        dedup_h = {}
        for r in filter_questionnaire(req.operator, req.filters, res2):
            for i in range(len(r.datas)):
                if str(r.datas[i].data_id) in dedup_h:
                    continue
                dedup_h[str(r.datas[i].data_id)] = 1
                custom_id = r.datas[i].custom.get("id", "")
                sheet.append(
                    [
                        str(r.questionnaire_id),
                        str(r.datas[i].data_id),
                        custom_id,
                    ]
                )

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


@router.get(
    "/filters/data/export",
    summary="下载标注结果",
    description="下载标注结果",
    response_class=StreamingResponse,
)
async def export_label_data(params: str):
    req = schemas.operator.stats.ReqFilterAnswer.model_validate(json.loads(params))
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    for i in range(len(req.filters)):
        filter_opt = req.filters[i]
        for v in extract_choice_config(task.tool_config, filter_opt.scope):
            if v.get("value", "") == filter_opt.question:
                if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ENUM:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ENUM
                else:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ARRAY

    if req.kind == schemas.operator.stats.ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:
        res: list[ExportFilterLabelIDWithoutDupProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelIDWithoutDupProjectModel,
            )
            .to_list()
        )

        async def export_stream_data() -> AsyncGenerator:
            datas = ""
            index = 0
            dedup_h: dict[str, int] = {}
            for v in res:
                if str(v.data.data_id) in dedup_h:
                    continue
                dedup_h[str(v.data.data_id)] = 1
                index += 1
                datas += (
                    schemas.data.DoData.model_validate(
                        v.data, from_attributes=True
                    ).model_dump_json()
                    + "\n"
                )
                if index % 100 == 0:
                    yield datas
                    datas = ""
            if datas:
                yield datas

    else:
        res2: list[ExportFilterLabelTaskProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelTaskProjectModel,
            )
            .to_list()
        )

        async def export_stream_data() -> AsyncGenerator:
            datas = ""
            index = 0
            dedup_h = {}
            for r in filter_questionnaire(req.operator, req.filters, res2):
                for i in range(len(r.datas)):
                    if str(r.datas[i].data_id) in dedup_h:
                        continue
                    dedup_h[str(r.datas[i].data_id)] = 1
                    index += 1
                    datas += (
                        schemas.data.DoData.model_validate(
                            r.datas[i], from_attributes=True
                        ).model_dump_json()
                        + "\n"
                    )

                    if index % 100 == 0:
                        yield datas
                        datas = ""
            if datas:
                yield datas

    resp = StreamingResponse(
        content=export_stream_data(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={datetime.now(tz=timezone(timedelta(hours=8))).strftime('%Y%m%d%H%M')}.jsonl"
        },
    )
    return resp


@router.post(
    "/filters/id/list",
    summary="获取标注 ID",
    description="获取标注 ID",
    response_model=Union[
        schemas.operator.stats.RespFilterAnswerQuestionnaireID,
        schemas.operator.stats.RespFilterAnswerDataID,
    ],
)
async def list_label_id(
    req: schemas.operator.stats.ReqFilterAnswerDataIDOrQuestionnaireID = Body(...),
) -> Union[
    schemas.operator.stats.RespFilterAnswerQuestionnaireID,
    schemas.operator.stats.RespFilterAnswerDataID,
]:
    task = await crud.label_task.query(task_id=req.task_id).first_or_none()
    if not task:
        raise exceptions.TASK_NOT_EXIST

    for i in range(len(req.filters)):
        filter_opt = req.filters[i]
        for v in extract_choice_config(task.tool_config, filter_opt.scope):
            if v.get("value", "") == filter_opt.question:
                if v.get("type", "") == schemas.operator.stats.CHOICE_KIND.ENUM:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ENUM
                else:
                    req.filters[i].type = schemas.operator.stats.CHOICE_KIND.ARRAY

    if req.kind == schemas.operator.stats.ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:
        res: list[ExportFilterLabelIDWithoutDupProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelIDWithoutDupProjectModel,
            )
            .to_list()
        )

        dedup_h = {}
        data_ids: list[schemas.operator.stats.DoDataRecord] = []
        for v in res:
            if str(v.data.data_id) in dedup_h:
                continue
            dedup_h[str(v.data.data_id)] = 1
            data_ids.append(
                schemas.operator.stats.DoDataRecord(
                    data_id=v.data.data_id, questionnaire_id=v.data.questionnaire_id
                )
            )
        return schemas.operator.stats.RespFilterAnswerDataID(
            _id=req.task_id, data=data_ids
        )

    else:
        res2: list[ExportFilterLabelTaskProjectModel] = (
            await crud.data.query(
                task_id=task.task_id, status=schemas.data.DataStatus.COMPLETED
            )
            .aggregate(
                build_filter_query(req.kind, req.operator, req.filters),
                projection_model=ExportFilterLabelTaskProjectModel,
            )
            .to_list()
        )

        dedup_h: dict[str, int] = {}
        questionnaire_ids: list[schemas.operator.stats.DoQuestionnaireRecord] = []
        for r in filter_questionnaire(req.operator, req.filters, res2):
            if str(r.questionnaire_id) in dedup_h:
                continue
            dedup_h[str(r.questionnaire_id)] = 1
            questionnaire_ids.append(
                schemas.operator.stats.DoQuestionnaireRecord(
                    questionnaire_id=r.questionnaire_id,
                    data_id=list(set([v.data_id for v in r.datas])),
                )
            )

        return schemas.operator.stats.RespFilterAnswerQuestionnaireID(
            _id=req.task_id, data=questionnaire_ids
        )
