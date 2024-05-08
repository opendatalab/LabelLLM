# FastAPI 项目 - 后端

## 要求

* [Docker](https://www.docker.com/).
* [Pdm](https://pdm.fming.dev/) 用于 Python 包和环境管理。

## 本地开发

* 使用 Docker Compose 启动堆栈：

```bash
docker compose up -d
```

* 现在你可以打开浏览器并与以下 URL 进行交互：

基于 Docker 构建的前端，根据路径处理路由：http://localhost

基于 OpenAPI 的 JSON web API 后端：http://localhost/api/

使用 Swagger UI 的自动交互式文档（来自 OpenAPI 后端）：http://localhost/docs

Adminer，数据库 web 管理：http://localhost:8080

Traefik UI，查看代理如何处理路由：http://localhost:8090

**注意**：你首次启动堆栈时，可能需要一分钟才能准备就绪。后端在等待数据库准备就绪并配置所有内容时，你可以检查日志以监控它。

要检查日志，请运行：

```bash
docker compose logs
```

要检查特定服务的日志，添加服务的名称，例如：

```bash
docker compose logs backend
```

如果你的 Docker 不在 `localhost` 运行（上述 URL 将不起作用），你需要使用运行 Docker 的 IP 或域。

## 后端本地开发，附加细节

### 一般工作流

默认情况下，依赖项由 [Pdm](https://pdm.fming.dev/) 管理，去那里并安装它。

从 `./backend/`，你可以安装所有依赖项：

```console
$ pdm install
```

然后你可以启动一个新环境的 shell 会话：

```console
$ pdm shell
```

确保你的编辑器使用正确的 Python 虚拟环境。

在 `./backend/app/models.py` 中修改或添加 SQLModel 模型用于数据和 SQL 表，API 端点在 `./backend/app/api/`，CRUD（创建，读取，更新，删除）工具在 `./backend/app/crud.py`。

### 启用开放用户注册

默认情况下，后端已禁用用户注册，但已有一个注册用户的路由。如果你想允许用户自行注册，你可以在 `.env` 文件中将环境变量 `USERS_OPEN_REGISTRATION` 设置为 `True`。

修改环境变量后，重新启动 Docker 容器以应用更改。你可以通过运行以下命令来实现：

```console
$ docker compose up -d
```

### VS Code

已经有配置可以通过 VS Code 调试器运行后端，这样你可以使用断点，暂停并查看变量等。

设置也已经配置好，你可以通过 VS Code Python 测试选项卡运行测试。

### Docker Compose 覆盖

在开发过程中，你可以更改只会影响本地开发环境的 Docker Compose 设置，在文件 `docker-compose.override.yml` 中。

对该文件的更改只会影响本地开发环境，不会影响生产环境。因此，你可以添加“临时”更改以帮助开发工作流。

例如，后端代码的目录被挂载为 Docker "主机卷"，将你实时更改的代码映射到容器内的目录。这允许你立即测试更改，而无需再次构建 Docker 镜像。这只应在开发过程中完成，对于生产，你应该使用后端代码的最新版本构建 Docker 镜像。但在开发过程中，它可以让你非常快速地迭代。

还有一个命令覆盖，它运行 `/start-reload.sh`（包含在基础镜像中）而不是默认的 `/start.sh`（也包含在基础镜像中）。它启动一个单独的服务器进程（而不是多个，这将用于生产）并在代码更改时重新加载进程。请注意，如果你有语法错误并保存 Python 文件，它将中断并退出，容器将停止。之后，你可以通过修复错误并再次运行来重启容器：

```console
$ docker compose up -d
```

还有一个被注释掉的 `command` 覆盖，你可以取消注释它并注释默认的。它使后端容器运行一个“什么都不做”的进程，但保持容器活动。这允许你进入你的运行容器并在内部执行命令，例如 Python 解释器来测试已安装的依赖项，或启动检测到更改时重新加载的开发服务器。

要使用 `bash` 会话进入容器，你可以启动堆栈：

```console
$ docker compose up -d
```

然后 `exec` 进入运行的容器：

```console
$ docker compose exec backend bash
```

你应该看到类似的输出：

```console
root@7f2607af31c3:/app#
```

这意味着你在容器内的 `bash` 会话中，作为 `root` 用户，在 `/app` 目录下，这个目录内有另一个名为 "app" 的目录，这就是你的代码在容器内的位置：`/app/app`。

在那里，你可以使用脚本 `/start-reload.sh` 来运行调试实时重新加载服务器。你可以在容器内运行该脚本：

```console
$ bash /start-reload.sh
```

...它会看起来像：

```console
root@7f2607af31c3:/app# bash /start-reload.sh
```

然后按回车。这将运行实时重新加载服务器，当它检测到代码更改时自动重新加载。

然而，如果它检测不到更改但是语法错误，它将只是停止并报错。但由于容器仍然活动并且你在 Bash 会话中，你可以在修复错误后快速重新启动它，运行相同的命令（"向上箭头" 和 "Enter"）。

...这个先前的细节使得在 Bash 会话中，让容器保持活动并什么都不做，然后让它运行实时重新加载服务器变得有用。

### 后端测试

要测试后端，请运行：

```console
$ bash ./scripts/test.sh
```

测试使用 Pytest 运行，修改并添加测试到 `./backend/app/tests/`。

如果你使用 GitHub Actions，测试将自动运行。

#### 测试运行堆栈

如果你的堆栈已经启动并且你只想运行测试，你可以使用：

```bash
docker compose exec backend bash /app/tests-start.sh
```

那个 `/app/tests-start.sh` 脚本只是在确保堆栈的其余部分正在运行后调用 `pytest`。如果你需要向 `pytest` 传递额外的参数，你可以将它们传递给该命令，它们将被转发。

例如，要在首次错误时停止：

```bash
docker compose exec backend bash /app/tests-start.sh -x
```

#### 测试覆盖率

当测试运行时，会生成一个文件 `htmlcov/index.html`，你可以在浏览器中打开它以查看测试的覆盖率。

### 迁移

由于在本地开发过程中，你的应用目录被挂载为容器内的卷，你也可以在容器内运行 `alembic` 命令进行迁移，迁移代码将在你的应用目录中（而不仅仅在容器内）。因此，你可以将其添加到你的 git 仓库。

确保你为模型创建了一个"修订版"，并且每次更改它们时，都要使用该修订版"升级"你的数据库。因为这将更新你的数据库中的表。否则，你的应用程序将出错。

* 在后端容器中启动一个交互式会话：

```console
$ docker compose exec backend bash
```

* Alembic 已经配置好从 `./backend/app/models.py` 导入你的 SQLModel 模型。

* 更改模型后（例如，添加一列），在容器内，创建一个修订版，例如：

```console
$ alembic revision --autogenerate -m "Add column last_name to User model"
```

* 将在 alembic 目录中生成的文件提交到 git 仓库。

* 创建修订版后，在数据库中运行迁移（这实际上会更改数据库）：

```console
$ alembic upgrade head
```

如果你不想完全使用迁移，取消注释文件 `./backend/app/core/db.py` 中以以下内容结束的行：

```python
SQLModel.metadata.create_all(engine)
```

并注释文件 `prestart.sh` 中包含以下内容的行：

```console
$ alembic upgrade head
```

如果你不想从默认模型开始，并希望从一开始就删除/修改它们，而不需要任何先前的修订版，你可以删除 `./backend/app/alembic/versions/` 下的修订文件（`.py` Python 文件）。然后按照上述方式创建第一个迁移。