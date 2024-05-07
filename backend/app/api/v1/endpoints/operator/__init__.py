from fastapi import APIRouter, Depends

from app.api import deps

from . import audit_task, label_task, label_task_stat

router = APIRouter(
    prefix="/operator",
    tags=["operator"],
    dependencies=[Depends(deps.is_admin_or_operator)],
)
router.include_router(label_task.router)
router.include_router(audit_task.router)
router.include_router(label_task_stat.router)

