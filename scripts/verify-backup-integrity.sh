#!/usr/bin/env sh
set -eu

if [ -z "${BACKUP_DIR:-}" ]; then
  echo "Set BACKUP_DIR before verifying."
  exit 1
fi
find "$BACKUP_DIR" -type f | wc -l | awk '{ print "Files found in backup: " $1 }'
echo "Manual restore drill and audit hash-chain verification are still required."
