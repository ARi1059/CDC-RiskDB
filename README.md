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

Debian 12 服务器请直接用一键部署脚本（见下方「部署」）。

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

## 部署（Debian 12，一键脚本）

```bash
git clone https://github.com/ARi1059/CDC-RiskDB.git && cd CDC-RiskDB
sudo bash deploy/deploy.sh   # 按提示输入 BOT_TOKEN 与 ADMIN_TELEGRAM_IDS
```

脚本自动装 Node 22 / PostgreSQL / Redis、建库、写 `.env`、迁移、构建，并以 systemd 服务
（专用用户 `cdcbot`，崩溃自动重启）运行；每日 `pg_dump` 备份。详见 [deploy/README.md](deploy/README.md)。

## 功能

- 🔍 查询用户 · 🚫 录入黑名单（判重 / 更新原因 / 软删除）· 📣 录入广播
- 👨‍🏫 老师管理 · 📢 机器人公告 · 👑 管理员管理
- 全键盘按钮交互、Telegram 用户分享获取目标、Admin / Teacher 两级权限

详见 [需求文档](docs/开发文档-V1.0.md) 与 [开发计划](docs/开发计划-V1.0.md)。
