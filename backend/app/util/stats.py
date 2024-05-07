from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app import models, schemas
from app.schemas.evaluation import QuestionnaireEvaluation
from app.schemas.operator.stats import (
    ANSWER_FLITER_KIND,
    ANSWER_SCOPE,
    BOOL_OPERATOR,
    CHOICE_KIND,
    MESSAGE_QUESTION_FIELD_NAME,
    FilterAnswerOption,
)

MESSAGE_TYPE = "receive"
QUESTION_TYPE = "send"


class Evaluation(BaseModel):
    # 针对单条消息的评价
    message_evaluation: dict | None = Field(
        description="针对单条消息的评价", default=None
    )

    # 针对单个提问的评价
    question_evaluation: dict | None = Field(
        description="针对单条消息的评价", default=None
    )

    # 针对整个对话的评价
    conversation_evaluation: dict | None = Field(
        description="针对整个对话的评价", default=None
    )

    # 针对整个问卷的评价
    questionnaire_evaluation: QuestionnaireEvaluation | None = Field(
        description="针对整个问卷的评价", default=None
    )


class ExportFilterLabelTaskProjectModel(BaseModel):
    questionnaire_id: UUID = Field(alias="_id")
    evaluations: list[Evaluation] = Field(
        description="join 查询出的 evaluation 记录",
    )
    datas: list[models.data.Data] = Field(description="数据库查询出的数据")


class ExportFilterLabelIDWithoutDupProjectModel(BaseModel):
    data: models.data.Data = Field(description="数据")


def str_message_question_field_name(scope: ANSWER_SCOPE) -> str:
    if scope == ANSWER_SCOPE.MESSAGE:
        return MESSAGE_TYPE
    elif scope == ANSWER_SCOPE.QUESTION:
        return QUESTION_TYPE
    else:
        return "unknown_message_question_field"


def str_scope(scope: ANSWER_SCOPE) -> str:
    scope_str = ""
    if scope == ANSWER_SCOPE.CONVERSATION:
        scope_str = "conversation_evaluation"
    elif scope == ANSWER_SCOPE.MESSAGE:
        scope_str = "message_evaluation"
    elif scope == ANSWER_SCOPE.QUESTION:
        scope_str = "question_evaluation"
    return scope_str


def extract_choice_config(tool_config: dict, scope: ANSWER_SCOPE) -> list[dict]:
    d = {}
    ret: list[dict] = []
    if scope == ANSWER_SCOPE.CONVERSATION:
        d = tool_config.get("conversation", {})
    elif scope == ANSWER_SCOPE.MESSAGE:
        d = tool_config.get("message", {})
    elif scope == ANSWER_SCOPE.QUESTION:
        d = tool_config.get("question", {})
    else:
        return ret

    for v in d.get("questions", ""):
        if not isinstance(v, dict):
            continue
        if v.get("type", "") not in (CHOICE_KIND.ENUM, CHOICE_KIND.ARRAY):
            continue
        ret.append(v)

    return ret


def build_format_message_evaluation():
    return [
        {
            "$addFields": {
                "evaluation.message_evaluation": {
                    "$ifNull": [
                        "$evaluation.message_evaluation",
                        {
                            "__default_bottom_placeholder": {
                                "__default_bottom_placeholder": "__default_bottom_placeholder"
                            }
                        },
                    ]
                }
            }
        },
        {"$addFields": {"data": {"$objectToArray": "$evaluation.message_evaluation"}}},
        {
            "$addFields": {
                "message_evaluation_stage1": {
                    "$filter": {
                        "input": "$data",
                        "as": "item",
                        "cond": {"$eq": ["$$item.v.__sys_message_type", MESSAGE_TYPE]},
                    }
                }
            }
        },
        {
            "$addFields": {
                "message_evaluation_stage2": {
                    "$map": {
                        "input": "$message_evaluation_stage1",
                        "as": "item",
                        "in": "$$item.v",
                    }
                }
            }
        },
        {
            "$set": {
                "message_evaluation_stage3": {
                    "$cond": {
                        "if": {"$gte": [{"$size": "$message_evaluation_stage2"}, 1]},
                        "then": "$message_evaluation_stage2",
                        "else": [
                            {
                                "__default_bottom_placeholder": "__default_bottom_placeholder"
                            }
                        ],
                    }
                }
            }
        },
        {
            "$addFields": {
                "question_evaluation_stage1": {
                    "$filter": {
                        "input": "$data",
                        "as": "item",
                        "cond": {"$eq": ["$$item.v.__sys_message_type", QUESTION_TYPE]},
                    }
                }
            }
        },
        {
            "$addFields": {
                "question_evaluation_stage2": {
                    "$map": {
                        "input": "$question_evaluation_stage1",
                        "as": "item",
                        "in": "$$item.v",
                    }
                }
            }
        },
        {
            "$set": {
                "question_evaluation_stage3": {
                    "$cond": {
                        "if": {"$gte": [{"$size": "$question_evaluation_stage2"}, 1]},
                        "then": "$question_evaluation_stage2",
                        "else": [
                            {
                                "__default_bottom_placeholder": "__default_bottom_placeholder"
                            }
                        ],
                    }
                }
            }
        },
        {"$unwind": {"path": "$message_evaluation_stage3"}},
        {"$unwind": {"path": "$question_evaluation_stage3"}},
        {
            "$group": {
                "_id": "$_id",
                "data_id": {"$addToSet": "$data_id"},
                "questionnaire_id": {"$addToSet": "$questionnaire_id"},
                "message_evaluation": {"$addToSet": "$message_evaluation_stage3"},
                "question_evaluation": {"$addToSet": "$question_evaluation_stage3"},
                "evaluation": {"$addToSet": "$evaluation"},
                "custom_id": {"$first": "$custom.id"},
            }
        },
        {"$unwind": "$data_id"},
        {"$unwind": "$questionnaire_id"},
        {"$unwind": "$message_evaluation"},
        {"$unwind": "$question_evaluation"},
        {"$unwind": "$evaluation"},
        {
            "$addFields": {
                "evaluation.message_evaluation": "$message_evaluation",
                "evaluation.question_evaluation": "$question_evaluation",
            },
        },
        {
            "$project": {
                "evaluation": 1,
                "data_id": 1,
                "questionnaire_id": 1,
                "custom_id": 1,
            }
        },
    ]


def build_agg_choice_count(
    scope: ANSWER_SCOPE, kind: CHOICE_KIND, choice_name: str
) -> list[dict]:
    scope_str = str_scope(scope)

    sql_arr = build_format_message_evaluation()

    if kind == CHOICE_KIND.ENUM:
        sql_arr.extend(
            [
                {
                    "$group": {
                        "_id": f"$evaluation.{scope_str}.{choice_name}",
                        "data_ids": {"$addToSet": "$data_id"},
                    }
                },
                {"$addFields": {"count": {"$size": "$data_ids"}}},
                {"$project": {"_id": 1, "count": 1}},
            ]
        )

    else:
        sql_arr.extend(
            [
                {
                    "$unwind": {
                        "path": f"$evaluation.{scope_str}.{choice_name}",
                    }
                },
                {
                    "$group": {
                        "_id": f"$evaluation.{scope_str}.{choice_name}",
                        "data_ids": {"$addToSet": "$data_id"},
                    }
                },
                {"$addFields": {"count": {"$size": "$data_ids"}}},
                {"$project": {"_id": 1, "count": 1}},
            ]
        )
    return sql_arr


def build_download_stats_id(
    scope: ANSWER_SCOPE, kind: CHOICE_KIND, question_value: str, choice_value: str
) -> list[dict]:
    scope_str = str_scope(scope)
    sql_arr = build_format_message_evaluation()
    if kind == CHOICE_KIND.ENUM:
        sql_arr.extend(
            [
                {
                    "$match": {
                        f"evaluation.{scope_str}.{question_value}": choice_value,
                    }
                },
                {
                    "$group": {
                        "_id": "$data_id",
                        "data_id": {"$addToSet": "$data_id"},
                        "questionnaire_id": {"$addToSet": "$questionnaire_id"},
                        "custom_id": {"$addToSet": "$custom_id"},
                    }
                },
                {"$unwind": "$data_id"},
                {"$unwind": "$questionnaire_id"},
                {
                    "$project": {
                        "data_id": 1,
                        "questionnaire_id": 1,
                        "custom_id": 1,
                    }
                },
                {"$sort": {"questionnaire_id": 1}},
            ]
        )
    else:
        sql_arr.extend(
            [
                {
                    "$match": {
                        f"evaluation.{scope_str}.{question_value}": {
                            "$elemMatch": {
                                "$eq": choice_value,
                            }
                        },
                    }
                },
                {
                    "$group": {
                        "_id": "$data_id",
                        "data_id": {"$addToSet": "$data_id"},
                        "questionnaire_id": {"$addToSet": "$questionnaire_id"},
                        "custom_id": {"$addToSet": "$custom.id"},
                    }
                },
                {"$unwind": "$data_id"},
                {"$unwind": "$questionnaire_id"},
                {
                    "$project": {
                        "data_id": 1,
                        "questionnaire_id": 1,
                        "custom_id": 1,
                    }
                },
                {"$sort": {"questionnaire_id": 1}},
            ]
        )
    return sql_arr


def build_filter_query(
    kind: ANSWER_FLITER_KIND,
    bool_combinator: BOOL_OPERATOR,
    opts: list[FilterAnswerOption],
) -> list[dict[str, Any]]:

    sql_arr = build_format_message_evaluation()
    op = "$and"
    if bool_combinator == BOOL_OPERATOR.OP_OR:
        op = "$or"

    if kind == ANSWER_FLITER_KIND.WITHOUT_DUPLICATE:
        sql_arr.extend(
            [
                {
                    "$match": (
                        {
                            op: [
                                (
                                    {
                                        f"evaluation.{str_scope(opt.scope)}.{opt.question}": "".join(
                                            opt.answer
                                        )
                                    }
                                    if opt.type == CHOICE_KIND.ENUM
                                    else {
                                        "$and": [
                                            {
                                                f"evaluation.{str_scope(opt.scope)}.{opt.question}": {
                                                    "$all": [
                                                        {"$elemMatch": {"$eq": answer}}
                                                        for answer in opt.answer
                                                    ]
                                                }
                                            },
                                            {
                                                f"evaluation.{str_scope(opt.scope)}.{opt.question}": {
                                                    "$size": len(opt.answer)
                                                }
                                            },
                                        ]
                                    }
                                )
                                for opt in opts
                            ]
                        }
                        if len(opts) > 0
                        else {}
                    )
                },
                {
                    "$group": {
                        "_id": "$data_id",
                    }
                },
                {
                    "$lookup": {
                        "from": "Data",
                        "localField": "_id",
                        "foreignField": "data_id",
                        "as": "data",
                    }
                },
                {"$unwind": {"path": "$data"}},
                {"$project": {"data": 1}},
                {"$sort": {"data.questionnaire_id": 1}},
            ]
        )
    else:
        sql_arr.extend(
            [
                {
                    "$lookup": {
                        "from": "Data",
                        "localField": "data_id",
                        "foreignField": "data_id",
                        "as": "data",
                    }
                },
                {"$unwind": {"path": "$data"}},
                {
                    "$project": {
                        "questionnaire_id": 1,
                        "evaluation": 1,
                        "data": 1,
                    }
                },
                {
                    "$group": {
                        "_id": "$questionnaire_id",
                        "evaluations": {"$push": "$evaluation"},
                        "datas": {"$push": "$data"},
                    }
                },
                {"$sort": {"_id": 1}},
            ]
        )

    return sql_arr


def filter_questionnaire(
    operator: BOOL_OPERATOR,
    filters: list[FilterAnswerOption],
    records: list[ExportFilterLabelTaskProjectModel],
) -> list[ExportFilterLabelTaskProjectModel]:
    validate_idx = []
    for idx, v in enumerate(records):
        flags = []
        conversation_eval = [vv.conversation_evaluation or {} for vv in v.evaluations]
        question_eval = [vv.question_evaluation or {} for vv in v.evaluations]
        message_eval = [vv.message_evaluation or {} for vv in v.evaluations]
        questionnaire_eval = [
            vv.questionnaire_evaluation or None for vv in v.evaluations
        ]
        data_ids = [str(vv.id) for vv in v.datas]
        if 2 > len(set(data_ids)):
            flags.append(False)
            continue

        for predicate in filters:
            ans_by_group: dict[str, list] = {}
            eval_arr = []
            is_invalid_questionnaires: list[bool] = [
                q.is_invalid_questionnaire if q is not None else False
                for q in questionnaire_eval
            ]
            if predicate.scope == schemas.operator.stats.ANSWER_SCOPE.CONVERSATION:
                eval_arr = conversation_eval
            elif predicate.scope == schemas.operator.stats.ANSWER_SCOPE.MESSAGE:
                eval_arr = message_eval
            else:
                eval_arr = question_eval

            for i, d in enumerate(eval_arr or []):
                if d is None:
                    ans = "__default_skip_answer"
                    if ans not in ans_by_group:
                        ans_by_group[ans] = []
                    ans_by_group[ans].append(data_ids[i])
                elif predicate.type == schemas.operator.stats.CHOICE_KIND.ARRAY:
                    ret_v = sorted(d.get(predicate.question, [""]))
                    ans = "#@#".join(ret_v)
                    if ans not in ans_by_group:
                        ans_by_group[ans] = []
                    ans_by_group[ans].append(data_ids[i])
                else:
                    ans = d.get(predicate.question, "__default_empty_answer")
                    if ans not in ans_by_group:
                        ans_by_group[ans] = []
                    ans_by_group[ans].append(data_ids[i])
            answer_with_votes = [
                len(set(ans_by_group[key])) == len(set(data_ids))
                for key in ans_by_group
            ]

            if predicate.answer[0] == "equal":  # 需要和前端制定
                if any(answer_with_votes):
                    flags.append(True)
                else:
                    flags.append(False or all(is_invalid_questionnaires))
            else:
                if all(answer_with_votes):
                    flags.append(False)
                else:
                    flags.append(True)

        if operator == schemas.operator.stats.BOOL_OPERATOR.OP_AND:
            if len(flags) == 0 or all(flags):
                validate_idx.append(idx)
        else:
            if len(flags) > 0 and any(flags):
                validate_idx.append(idx)
    ret: list[ExportFilterLabelTaskProjectModel] = []
    for i in validate_idx:
        ret.append(records[i])
    return ret
