#!/bin/bash
set -euo pipefail

cd /opt/clothy

DATABASE_URL=$(grep -oP '(?<=DATABASE_URL=")[^"]+' .env)
BOT_TOKEN=$(grep -oP '(?<=TELEGRAM_BOT_TOKEN=")[^"]+' .env)
ADMIN_ID=$(grep -oP '(?<=TELEGRAM_ADMIN_ID=")[^"]+' .env)

BACKUP_DIR=/opt/clothy/backups
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILEPATH="${BACKUP_DIR}/clothy_${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILEPATH"

# Keep only the last 7 backups on disk
ls -1t "$BACKUP_DIR"/clothy_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

SIZE=$(du -h "$FILEPATH" | cut -f1)

curl -s -F "chat_id=${ADMIN_ID}" \
     -F "document=@${FILEPATH}" \
     -F "caption=📦 Бэкап БД Clothy.by — $(date '+%d.%m.%Y %H:%M') (${SIZE})" \
     "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" > /tmp/clothy-backup-last.log
