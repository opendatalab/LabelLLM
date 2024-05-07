from fastapi import HTTPException
from pydantic import BaseModel


class ErrorMessage(BaseModel):
    code: int = 0
    message: str = "Bad Request"


class AppEx(HTTPException):
    def __init__(self, code: int, message: str, *, status_code=400) -> None:
        super().__init__(
            status_code=status_code,
            detail=ErrorMessage(code=status_code * 1000 + code, message=message).dict(),
        )


# Module Error Code
COMMON = 000
AUTH = 100
USER = 200
TASK = 300
DATA = 400
RECORD = 500
FILE = 600
FLOW = 700
TOOL = 800
TEAM = 900

# 通用
SERVER_ERROR = AppEx(COMMON + 1, "Server error", status_code=500)  # 服务器错误
USER_PERMISSION_DENIED = AppEx(
    COMMON + 2, "User permission denied", status_code=403
)  # 用户权限不足
PARAMS_ERROR = AppEx(COMMON + 3, "Params error")  # 参数错误

# 认证
TOKEN_INVALID = AppEx(AUTH + 1, "Token invalid", status_code=401)  # Token 无效

# 用户
USER_NOT_EXIST = AppEx(USER + 1, "User not exist")  # 用户不存在
USER_NOT_ALLOWED_OPERATION = AppEx(
    USER + 2, "User not allowed to perform this operation"
)  # 用户禁止做此操作
USER_IS_OPERATOR_ALREADY_YET = AppEx(
    USER + 3, "User is operator already yet"
)  # 用户已经是运营


# 任务
TASK_NOT_EXIST = AppEx(TASK + 1, "Task not exist")  # 任务不存在
# 该任务状态下不允许执行此操作
TASK_STATUS_NOT_ALLOW = AppEx(TASK + 2, "Task status not allow")
# 任务流程不存在
TASK_FLOW_NOT_EXIST = AppEx(TASK + 3, "Task flow not exist")
# 该标注任务已有审核任务
TASK_HAS_AUDIT_TASK = AppEx(TASK + 4, "Task has audit task")
# 任务已结束
TASK_IS_DONE = AppEx(TASK + 5, "Task is done")
# 有后续任务，不允许删除当前任务
TASK_HAS_NEXT_TASK = AppEx(TASK + 6, "Task has next task")

# 数据
DATA_NOT_EXIST = AppEx(DATA + 1, "Data not exist")  # 数据不存在
DATA_NOT_BELONG_TO_USER = AppEx(DATA + 2, "Data not belong to user")  # 数据不属于用户
DATA_BALANCE_NOT_ENOUGH = AppEx(DATA + 3, "Data balance not enough")  # 数据余额不足

# 数据记录
RECORD_NOT_EXIST = AppEx(RECORD + 1, "Record not exist")  # 数据记录不存在

# 文件上传
FILE_UPLOAD_LIMIT = AppEx(FILE + 1, "Upload limit")  # 上传限制

# 流程
FLOW_NOT_EXIST = AppEx(FLOW + 1, "Flow not exist")  # 流程不存在
FLOW_RATIO_ILLEGAL = AppEx(FLOW + 2, "Sample Ratio Illegal") # 抽样比例不合理

# 工具
TRANSLATE_SERVICE_ERROR = AppEx(TOOL + 1, "Translate service error")  # 翻译服务错误

# 团队
TEAM_NOT_EXIST = AppEx(TEAM + 1, "Team not exist")  # 团队不存在
TEAM_CAN_NOT_KICK_FROM_DEFAULT_TEAM = AppEx(
    TEAM + 2, "Can not kick user out of default_team"
)
TEAM_USER_NOT_JOINED = AppEx(TEAM + 3, "User has not joined this team")
TEAM_USER_ALREADY_JOINED = AppEx(TEAM + 4, "User has already joined this team")
TEAM_USER_ROLE_EMPTY = AppEx(TEAM + 5, "Team member role is null")
TEAM_USER_AT_LEAST_HAVE_ONE_SUPER_ADMIN = AppEx(
    TEAM + 6, "Team should have one super_admin at least"
)

# 团队邀请链接
TEAM_INVITATION_NOT_EXISTS = AppEx(TEAM + 51, "link not existed")
