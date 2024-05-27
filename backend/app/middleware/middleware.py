from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, Request
from loguru import logger
from starlette.types import Message


async def set_body(_receive: Message):
    async def receive() -> Message:
        return _receive

    return receive


def init_middleware(app: FastAPI):
    app.middleware("http")(call_info)
    app.middleware("http")(add_request_id_logger)
    app.middleware("http")(add_request_id)


async def add_request_id(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-Id", None)
    if not request.state.request_id:
        request.state.request_id = uuid4().hex

    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response


async def add_request_id_logger(request: Request, call_next):
    request.state.logger = logger.bind(request_id=request.state.request_id)
    response = await call_next(request)
    return response


async def call_info(
    request: Request,
    call_next,
):
    # request start
    request.state.logger.info(
        "request start | {} | {}",
        request.method,
        request.url.path,
    )

    # 小于1M的请求打印body
    content_length = request.headers.get("Content-Length", "")
    if content_length.isdigit() and int(content_length) < 4096:
        body = await request._receive()
        request.state.logger.info(
            "request body | {}",
            body["body"].decode(),
        )
        request._receive = await set_body(body)

    start_time = datetime.utcnow()

    response = await call_next(request)

    process_time = (datetime.utcnow() - start_time).microseconds / 1000

    # user info
    request.state.logger.info(
        "user info | user_id: {}",
        request.state.user_id if hasattr(request.state, "user_id") else None,
    )

    # response info
    request.state.logger.info(
        "request end | process time: {}ms | status code: {}",
        process_time,
        response.status_code,
    )

    return response
