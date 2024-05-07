from typing import Any

from beanie.operators import In, RegEx

from app.crud.base import CRUDBase
from app.models.user import User, UserCreate, UserUpdate
from app.schemas.user import UserType


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def query(
        self,
        *,
        _id: list[Any] | Any = None,
        skip: int | None = None,
        limit: int | None = None,
        sort: str | list[str] | None = None,
        user_id: list[str] | str | None = None,
        name: str | None = None,
        role: list[UserType] | UserType | None = None,
    ):
        query = super().query(_id=_id, sort=sort, skip=skip, limit=limit)

        if user_id is not None:
            if isinstance(user_id, list):
                query = query.find(In(self.model.user_id, user_id))
            else:
                query = query.find(self.model.user_id == user_id)

        if role:
            if isinstance(role, list):
                query = query.find(In(self.model.role, role))
            else:
                query.find(self.model.role==role)

        if name:
            query = query.find(RegEx(field=self.model.name, pattern=name))  # type: ignore

        return query


user = CRUDUser(User)
