#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-backups/minio/$(date +%Y%m%d-%H%M%S)}"
S3_BUCKET="${S3_BUCKET:-udyogsetu-documents}"
mkdir -p "$BACKUP_DIR"
if command -v mc >/dev/null 2>&1; then
  mc mirror "local/$S3_BUCKET" "$BACKUP_DIR"
else
  echo "MinIO client mc not installed. Install mc and configure alias 'local' before running."
fi
echo "MinIO backup target: $BACKUP_DIR"
