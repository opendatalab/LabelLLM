from typing import Any, Generic, Type, TypeVar

from beanie import Document
from beanie.operators import In
from motor.core import ClientSession
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=Document)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]) -> None:
        self.model = model

    async def get(self, _id: Any) -> ModelType | None:
        return await self.model.get(_id)

    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
    ):
        query = self.model.find()

        if _id is not None:
            if isinstance(_id, list):
                query = query.find(In(self.model.id, _id))
            else:
                query = query.find(self.model.id == _id)

        if skip is not None:
            query = query.skip(skip)

        if limit is not None:
            query = query.limit(limit)

        if sort is not None:
            if isinstance(sort, list):
                query = query.sort(*sort)
            else:
                query = query.sort(sort)

        return query

    async def create(
        self,
        *,
        obj_in: CreateSchemaType,
        session: ClientSession | None = None,
    ) -> ModelType:
        db_obj = self.model.model_validate(obj_in, from_attributes=True)
        await self.model.insert(db_obj, session=session)
        return db_obj

    async def create_many(
        self,
        *,
        obj_in: list[CreateSchemaType],
        session: ClientSession | None = None,
    ) -> list[ModelType]:
        db_obj = [self.model.model_validate(obj, from_attributes=True) for obj in obj_in]
        await self.model.insert_many(db_obj, session=session)
        return db_obj

    async def update(
        self,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType,
        session: ClientSession | None = None,
    ) -> ModelType:
        update_data = obj_in.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        await self.model.save(db_obj, session=session)
        return db_obj

    async def remove(
        self,
        _id: Any,
        *,
        session: ClientSession | None = None,
    ) -> None:
        obj = await self.get(_id)
        if obj is None:
            raise ValueError(f"{_id} not found")
        await self.model.delete(obj, session=session)
        return
