# llm-web（冰山之下）

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
