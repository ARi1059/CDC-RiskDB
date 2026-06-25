# CDC-RiskDB —— Telegram 黑名单共享机器人

老师之间共享黑名单数据的 Telegram 机器人。全键盘按钮交互，通过 Telegram 用户分享（Request User）获取目标用户信息。

- 需求文档：[docs/开发文档-V1.0.md](docs/开发文档-V1.0.md)
- 开发计划：[docs/开发计划-V1.0.md](docs/开发计划-V1.0.md)

## 技术栈

TypeScript · Telegraf · Prisma · PostgreSQL · Redis

## 环境要求

- Node.js ≥ 20（开发机当前 26 亦可）
- PostgreSQL 16
- Redis 7

macOS 可用 Homebrew 安装本地依赖：

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
# 首次创建数据库与用户
createdb riskdb
```

Ubuntu 24.04 用 `apt install postgresql redis-server` 并 `systemctl enable --now`。

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client（npm 11 默认不跑依赖安装脚本，需手动生成）
npm run prisma:generate

# 3. 准备环境变量
cp .env.example .env   # 填入 BOT_TOKEN、ADMIN_TELEGRAM_IDS，并核对 DATABASE_URL / REDIS_URL

# 4. 启动（确保本地 PostgreSQL 与 Redis 已运行）
npm run dev            # 开发热重载（tsx）
# 或
npm run build && npm start
```

> **慢网络 / 代理下 Prisma 引擎下载失败**：`prisma generate` 首次需下载查询引擎二进制。
> 国内网络可走镜像：
> ```bash
> PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma npm run prisma:generate
> ```
> 引擎会缓存到 `~/.cache/prisma`，之后即可离线生成。

## 常用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发模式（tsx 热重载） |
| `npm run build` | 编译到 `dist/` |
| `npm start` | 运行编译产物 `node dist/index.js` |
| `npm run typecheck` | 仅类型检查 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 格式化 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 开发迁移（M1 起使用） |

## 部署（Ubuntu 24.04，无容器）

`npm ci` → `npm run prisma:generate` → `npm run build`，再用 **systemd 服务**（或 PM2）
运行 `node dist/index.js`，崩溃自动重启；PostgreSQL / Redis 作为系统服务常驻。

## 里程碑

当前：**M0 脚手架（已完成）** —— 依赖安装、Prisma Client 生成、TypeScript 构建均通过；
空 bot 可启动、对任意文本消息回 `ok`、启动时连接 PostgreSQL + Redis。

后续里程碑 M1–M10 见开发计划。
