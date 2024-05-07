from fastapi import FastAPI
from tortoise import Tortoise
from tortoise.connection import connections

from app.core.config import settings
from app.models import models

TORTOISE_ORM = {
    "connections": {"default": str(settings.SQLALCHEMY_DATABASE_URI).removeprefix("postgresql+")},
    "apps": {
        "models": {
            "models": ["aerich.models", models],
        },
    },
}