#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-backups/mongodb/$(date +%Y%m%d-%H%M%S)}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/udyogsetu360}"
mkdir -p "$BACKUP_DIR"
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"
echo "MongoDB backup written to $BACKUP_DIR"
