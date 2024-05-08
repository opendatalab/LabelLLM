from enum import Enum


class Entity(str, Enum):
    user = "user"
    role = "role"
    permission = "permission"
    team = "team"


class Action(str, Enum):
    read = "read"
    create = "create"
    update = "update"
    delete = "delete"
