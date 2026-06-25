#!/usr/bin/env bash
#
# CDC-RiskDB 数据库备份（pg_dump + gzip + 轮转）
# 由 /etc/cron.d/cdc-riskdb-backup 每日调用；也可手动执行。
#
#   BACKUP_DIR=/var/backups/cdc-riskdb DB_NAME=riskdb bash deploy/backup.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/cdc-riskdb}"
DB_NAME="${DB_NAME:-riskdb}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/${DB_NAME}-${TS}.sql.gz"

# 以 postgres 超级用户本地导出（无需密码；runuser 属 util-linux，Debian 自带）
runuser -u postgres -- pg_dump "$DB_NAME" | gzip > "$FILE"
echo "[backup] $(date '+%F %T') -> $FILE"

# 轮转：删除超过 KEEP_DAYS 天的备份
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +"$KEEP_DAYS" -delete
