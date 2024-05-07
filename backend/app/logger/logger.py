import sys

from loguru import logger


def init_logger():
    logger.remove()

    # scheduler log
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss:SSS zz}</green> | <light-blue>scheduler</light-blue> | {level} | <level>{message}</level>",
        filter="app.scheduler",
    )

    # web middleware log
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss:SSS zz}</green> | <light-blue>middleware</light-blue> | {level} | {extra[request_id]} | <level>{message}</level>",
        filter="app.middleware",
    )

    # web log
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss:SSS zz}</green> | <light-blue>server</light-blue> | {level} | {extra[request_id]} | <level>{message}</level>",
        filter="app.api",
    )
