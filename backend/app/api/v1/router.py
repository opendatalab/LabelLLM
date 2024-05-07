from fastapi import APIRouter

from app.api.v1.endpoints.router import endpoint_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(endpoint_router)
