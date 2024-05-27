# FastAPI 项目 - 后端

## 要求

* [Docker](https://www.docker.com/).
* [Pdm](https://pdm.fming.dev/) 用于 Python 包和环境管理。

## 本地开发

* 使用 Docker Compose 启动：

```bash
docker compose up
```

* 使用 Docker Compose 更新

```bash
docker compose up --build
```

* 现在你可以打开浏览器并与以下 URL 进行交互：

基于 Docker 构建的前端，根据路径处理路由：http://localhost

基于 OpenAPI 的 JSON web API 后端：http://localhost/api/

使用 Swagger UI 的自动交互式文档（来自 OpenAPI 后端）：http://localhost/docs


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

在 `./backend/app/models.py` 中修改或添 模型用于数据和 SQL 表，API 端点在 `./backend/app/api/`，CRUD（创建，读取，更新，删除）工具在 `./backend/app/crud`。



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

### .env 配置说明

```yaml
# .env
# General settings
DEBUG = True # Enable debugging mode (set to False in production)
ENVIRONMENT=local # App environment (e.g., local, staging, production)

# MinIO storage configuration
MINIO_ACCESS_KEY_ID = MekKrisWUnFFtsEk # Access key ID for MinIO authentication
MINIO_ACCESS_KEY_SECRET = XK4uxD1czzYFJCRTcM70jVrchccBdy6C # Access key secret for MinIO authentication
MINIO_ENDPOINT = localhost:9000 # Public MinIO service endpoint
MINIO_INTERNAL_ENDPOINT = minio:9000 # Internal network MinIO service endpoint
MINIO_BUCKET = label-llm-test # Default MinIO bucket for storing data

# MongoDB configuration
MongoDB_DSN = mongodb://root:mypassword@mongo:27017 # MongoDB connection string with authentication
MongoDB_DB_NAME = label_llm # Database name for the application

# Redis configuration
REDIS_DSN = redis://redis:6379/11 # Redis connection string, pointing to the instance and database index

# Security settings
SECRET_KEY="?*hsbRq5c9gpjBp~:oHU+7s8,I.67ewohfsib1=17dw@.q9r4Iidop:Oi_5oIYgw" # Secret key for signing and security purposes

```