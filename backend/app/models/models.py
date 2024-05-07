from tortoise import fields, models

from app.schemas.entity import Entity, Action


class User(models.Model):
    id = fields.IntField(pk=True, description="主键")
    username = fields.CharField(max_length=50, description="用户名")
    password = fields.CharField(max_length=50, description="密码")
    email = fields.CharField(max_length=100, description="电子邮件")
    create_time = fields.DatetimeField(description="创建时间", auto_now_add=True)
    update_time = fields.DatetimeField(description="更新时间", auto_now=True)

    # relations
    teams: fields.ManyToManyRelation["Team"] = fields.ManyToManyField("models.Team")
    roles: fields.ManyToManyRelation["Role"] = fields.ManyToManyField("models.Role")

    class Meta:
        table = "user"


class Team(models.Model):
    id = fields.IntField(pk=True, description="主键")
    name = fields.CharField(max_length=50, description="团队名称")
    creator = fields.ForeignKeyField(
        "models.User", related_name="created_teams", description="创建者"
    )
    create_time = fields.DatetimeField(description="创建时间", auto_now_add=True)
    update_time = fields.DatetimeField(description="更新时间", auto_now=True)

    # relations
    user: fields.ReverseRelation["User"]

    class Meta:
        table = "team"


class Role(models.Model):
    id = fields.IntField(pk=True, description="主键")
    name = fields.CharField(max_length=50, description="角色名称")
    create_time = fields.DatetimeField(description="创建时间", auto_now_add=True)
    update_time = fields.DatetimeField(description="更新时间", auto_now=True)

    users: fields.ReverseRelation["User"]
    permissions: fields.ManyToManyRelation["Permission"] = fields.ManyToManyField(
        "models.Permission"
    )

    class Meta:
        table = "role"


class Permission(models.Model):
    id = fields.IntField(pk=True, description="主键")
    name = fields.CharField(max_length=50, description="权限名称")
    description = fields.TextField(description="描述", null=True)
    entity = fields.CharEnumField(Entity, description="实体")
    action = fields.CharEnumField(Action, description="动作")
    create_time = fields.DatetimeField(description="创建时间", auto_now_add=True)
    update_time = fields.DatetimeField(description="更新时间", auto_now=True)

    # relations
    roles: fields.ReverseRelation["Role"]

    class Meta:
        table = "permission"
