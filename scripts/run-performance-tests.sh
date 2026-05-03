#!/usr/bin/env sh
set -eu

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. Install k6 or run these scripts in a k6 container:"
  echo "  tests/performance/k6-caf-submission.js"
  echo "  tests/performance/k6-case-timeline.js"
  echo "  tests/performance/k6-public-dashboard.js"
  echo "  tests/performance/k6-department-inbox.js"
  echo "  tests/performance/k6-webhook-ingestion.js"
  exit 0
fi

k6 run tests/performance/k6-caf-submission.js
k6 run tests/performance/k6-case-timeline.js
k6 run tests/performance/k6-public-dashboard.js
k6 run tests/performance/k6-department-inbox.js
k6 run tests/performance/k6-webhook-ingestion.js
