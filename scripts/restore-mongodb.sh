#!/usr/bin/env sh
set -eu

if [ -z "${BACKUP_DIR:-}" ]; then
  echo "Set BACKUP_DIR to a mongodump directory."
  exit 1
fi
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/udyogsetu360}"
mongorestore --uri="$MONGODB_URI" --drop "$BACKUP_DIR"
echo "MongoDB restore completed from $BACKUP_DIR"
