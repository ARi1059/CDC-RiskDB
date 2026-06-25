# 部署（Debian 12 / bookworm）

一键部署脚本：在一台全新的 Debian 12 服务器上，从零到机器人上线。

## 一键部署

```bash
# 1. 克隆仓库
git clone https://github.com/ARi1059/CDC-RiskDB.git
cd CDC-RiskDB

# 2. 运行一键部署（root）
sudo bash deploy/deploy.sh
#    会提示输入 BOT_TOKEN 与 ADMIN_TELEGRAM_IDS
```

非交互方式（把密钥用环境变量传入）：

```bash
sudo BOT_TOKEN='8xxxx:AAxxxx' ADMIN_TELEGRAM_IDS='57102928,123456' bash deploy/deploy.sh
```

脚本会自动完成：

| 步骤 | 说明 |
|---|---|
| 系统依赖 | `apt` 装 PostgreSQL / Redis；NodeSource 装 Node.js 22 |
| 数据库 | 建角色 `riskdb`（随机密码）+ 数据库 `riskdb` |
| `.env` | 写入 `BOT_TOKEN` / `DATABASE_URL` / `REDIS_URL` / 管理员ID 等，权限 600 |
| 构建 | `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` |
| 运行 | 安装并启动 systemd 服务 `cdc-riskdb`（开机自启、崩溃自动重启） |
| 备份 | 每日 `pg_dump` 备份到 `/var/backups/cdc-riskdb`（保留 14 天） |

## 常用运维

```bash
# 实时日志
journalctl -u cdc-riskdb -f

# 重启 / 停止 / 状态
systemctl restart cdc-riskdb
systemctl stop cdc-riskdb
systemctl status cdc-riskdb

# 手动备份一次
sudo bash deploy/backup.sh
```

## 升级 / 重新部署

```bash
cd CDC-RiskDB
sudo git pull
sudo bash deploy/deploy.sh   # 沿用现有 .env：重装依赖、应用迁移、重新构建并重启
```

## 说明

- 运行身份：专用系统用户 `cdcbot`（非 root），systemd 加固 `NoNewPrivileges` / `ProtectSystem` / `PrivateTmp`。
- 运行模式：long polling，无需公网域名 / HTTPS / 反向代理。
- PostgreSQL：使用 Debian 12 自带版本（15）；本项目 schema 与 PG 15+ 兼容。
- 网络：机器人需能访问 `api.telegram.org`；国内服务器请确保具备相应网络条件。
- Prisma 引擎：`npm ci` 时自动随 `@prisma/client` 安装；如服务器拉取引擎缓慢，可设
  `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma` 后再跑脚本。
