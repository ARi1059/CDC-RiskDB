#!/usr/bin/env bash
#
# CDC-RiskDB 一键部署脚本（Debian 12 / bookworm）
#
# 用法（在已克隆的仓库根目录，root 执行）：
#   sudo bash deploy/deploy.sh
# 非交互（CI / 自动化）：
#   sudo BOT_TOKEN=xxx ADMIN_TELEGRAM_IDS=123,456 bash deploy/deploy.sh
#
# 首次执行：安装依赖、建库、写 .env、构建、装 systemd 服务并启动。
# 再次执行（git pull 后）：重装依赖、应用迁移、重新构建并重启服务（沿用现有 .env）。
set -euo pipefail

# ---------- 配置 ----------
APP_USER="cdcbot"
DB_NAME="riskdb"
DB_USER="riskdb"
NODE_MAJOR="22"
SERVICE_NAME="cdc-riskdb"
BACKUP_DIR="/var/backups/cdc-riskdb"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$APP_DIR/.env"

log() { echo -e "\033[1;32m[deploy]\033[0m $*"; }
err() { echo -e "\033[1;31m[deploy]\033[0m $*" >&2; }

[ "$(id -u)" -eq 0 ] || { err "请用 root 运行：sudo bash deploy/deploy.sh"; exit 1; }
[ -f "$APP_DIR/package.json" ] || { err "未在仓库根目录找到 package.json：$APP_DIR"; exit 1; }

# ---------- 收集密钥（仅首次） ----------
FIRST_RUN=0
if [ ! -f "$ENV_FILE" ]; then
  FIRST_RUN=1
  BOT_TOKEN="${BOT_TOKEN:-}"
  ADMIN_IDS="${ADMIN_TELEGRAM_IDS:-}"
  [ -n "$BOT_TOKEN" ] || read -rp "请输入 BOT_TOKEN（@BotFather）: " BOT_TOKEN
  [ -n "$ADMIN_IDS" ] || read -rp "请输入 ADMIN_TELEGRAM_IDS（逗号分隔的管理员数字ID）: " ADMIN_IDS
  [ -n "$BOT_TOKEN" ] || { err "BOT_TOKEN 不能为空"; exit 1; }
  [ -n "$ADMIN_IDS" ] || { err "ADMIN_TELEGRAM_IDS 不能为空"; exit 1; }
  DB_PASS="$(openssl rand -hex 16)"
fi

# ---------- 系统依赖 ----------
log "安装系统依赖（apt）..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg openssl postgresql redis-server

# Node.js（NodeSource，确保 >= 20）
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 20 ] && NODE_OK=1
fi
if [ "$NODE_OK" -eq 0 ]; then
  log "安装 Node.js ${NODE_MAJOR}.x（NodeSource）..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
log "Node $(node -v) / npm $(npm -v)"

# ---------- 启用服务 ----------
systemctl enable --now postgresql
systemctl enable --now redis-server

# ---------- 数据库（仅首次建库建角色） ----------
if [ "$FIRST_RUN" -eq 1 ]; then
  log "创建 PostgreSQL 角色与数据库..."
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$do\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$do\$;
SQL
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
    || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

# ---------- 应用用户 ----------
if ! id "$APP_USER" >/dev/null 2>&1; then
  log "创建系统用户 ${APP_USER}..."
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

# ---------- .env（仅首次写入） ----------
if [ "$FIRST_RUN" -eq 1 ]; then
  log "写入 .env ..."
  cat > "$ENV_FILE" <<ENV
BOT_TOKEN=${BOT_TOKEN}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
REDIS_URL=redis://localhost:6379
ADMIN_TELEGRAM_IDS=${ADMIN_IDS}
NODE_ENV=production
LOG_LEVEL=info
BROADCAST_RATE_PER_SEC=25
TZ=Asia/Shanghai
ENV
  chmod 600 "$ENV_FILE"
fi

# ---------- 安装依赖、迁移、构建 ----------
log "安装依赖（npm ci）..."
cd "$APP_DIR"
npm ci
log "生成 Prisma Client..."
npm run prisma:generate
log "应用数据库迁移（migrate deploy）..."
npm run prisma:deploy
log "编译 TypeScript..."
npm run build

# ---------- 权限 ----------
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# ---------- systemd 服务 ----------
log "安装 systemd 服务 ${SERVICE_NAME} ..."
NODE_BIN="$(command -v node)"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<UNIT
[Unit]
Description=CDC-RiskDB Telegram 黑名单共享机器人
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} ${APP_DIR}/dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
# 安全加固
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

# ---------- 每日备份 cron ----------
log "配置每日数据库备份..."
mkdir -p "$BACKUP_DIR"
cat > "/etc/cron.d/cdc-riskdb-backup" <<CRON
# CDC-RiskDB 每日 03:37 备份数据库（保留 14 天）
37 3 * * * root BACKUP_DIR=${BACKUP_DIR} DB_NAME=${DB_NAME} bash ${APP_DIR}/deploy/backup.sh >> /var/log/cdc-riskdb-backup.log 2>&1
CRON

# ---------- 收尾 ----------
sleep 2
echo
systemctl --no-pager --full status "${SERVICE_NAME}" | head -12 || true
echo
log "部署完成 ✅"
log "查看实时日志： journalctl -u ${SERVICE_NAME} -f"
log "重启服务：     systemctl restart ${SERVICE_NAME}"
if [ "$FIRST_RUN" -eq 1 ]; then
  log "数据库密码已写入 ${ENV_FILE}（权限 600）。"
fi
