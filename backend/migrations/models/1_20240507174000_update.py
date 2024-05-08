from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "permission" ADD "entity" VARCHAR(10) NOT NULL;
        ALTER TABLE "permission" ADD "action" VARCHAR(6) NOT NULL;
        ALTER TABLE "permission" ALTER COLUMN "description" DROP NOT NULL;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "permission" DROP COLUMN "entity";
        ALTER TABLE "permission" DROP COLUMN "action";
        ALTER TABLE "permission" ALTER COLUMN "description" SET NOT NULL;"""
