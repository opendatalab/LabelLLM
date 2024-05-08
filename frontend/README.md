# todo
1. logo 更新
2. 帮助中心

#api

/v1/team/member/edit 更新团队成员角色
/**
* 获取审核任务列表
  */
  export const getAuditTaskList = (body: TaskQueryBody): Promise<ListPayload<AuditTaskListItem>> => {
  return request.post('/v1/operator/task/audit/list', body);
  };

/**
* 获取审核任务详情
  */
  export const getAuditTaskDetail = (params: Record<string, unknown>, body: TaskDetailBody): Promise<AuditTaskDetail> => {
  return request.post(`/v1/operator/task/audit/detail`, body, {
  params,
  });
  };
  /**
* 更新进行中的审核任务的团队
  */
  export const updateAuditTaskTeams = (body: UpdateTeamPayload): Promise<{ task_id: string }> => {
  return request.put(`/v1/operator/task/audit/flow/team/update`, body);
  };

/**
* 删除审核任务
  */
  export const deleteAuditTask = (body: { task_id: string }): Promise<any> => {
  return request.post(`/v1/operator/task/audit/delete`, body);
  };

/**
* 导出审核任务数据
* @param taskId 任务id
  */
  export const exportAuditTask = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/audit/data/export?task_id=${taskId}`);
  };

/**
* 导出标注工作量
* @param taskId 任务id
  */
  export const exportAuditTaskWorkload = async (taskId: string) => {
  downloadFromUrl(`/api/v1/operator/task/audit/data/export_workload?task_id=${taskId}`);
  };



大语言模型平台-Web 端

## 开始

### 安装依赖

```bash
npm install
# pnpm install
```

### 启动菜单

```bash
npm start
# pnpm start

? 请选择要执行的命令 (Use arrow keys)
❯ 启动供应商端（supplier）
  启动运营端（operator）
  打包供应商端（supplier）
  打包运营端（operator）
  全部打包
```

### 启动供应商端（supplier）

```bash
npm run start:supplier
# pnpm start:supplier
```

### 启动运营端（operator）

```bash
npm run start:operator
# pnpm start:operator
```

### 构建

```bash
npm run build
# pnpm build
```

### 分析

```bash
npm run analyze
# pnpm analyze
```

### Mock 方式启动

```bash
MOCK=true npm run start:mock
# MOCK=true pnpm start:chat
```

## 配置和约定

### 配置

- 接口服务的 url 在[`config/apiUrls.ts`](./config/apiUrls.ts)中配置；

### 约定

- 仅 `app` 中使用到的组件放在对应 `app` 的 `components` 目录下；
- `app` 和 `app` 之间的代码不要相互引用，存在这种情况时，将代码提升到 web 下的其他目录如
  - `web/components`
  - `web/layouts`
  - `web/utils`
  - ...
