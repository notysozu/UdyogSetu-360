#!/usr/bin/env sh
set -eu

if [ -z "${BACKUP_DIR:-}" ]; then
  echo "Set BACKUP_DIR to a MinIO backup directory."
  exit 1
fi
S3_BUCKET="${S3_BUCKET:-udyogsetu-documents}"
if command -v mc >/dev/null 2>&1; then
  mc mirror "$BACKUP_DIR" "local/$S3_BUCKET"
else
  echo "MinIO client mc not installed. Install mc and configure alias 'local' before running."
fi
echo "MinIO restore completed from $BACKUP_DIR"
