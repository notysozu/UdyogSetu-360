#!/usr/bin/env sh
set -eu

check_url() {
  name="$1"
  url="$2"
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
  case "$code" in
    2*|3*) echo "PASS $name $url $code" ;;
    *) echo "WARN $name $url $code" ;;
  esac
}

check_url "gateway health" "${GATEWAY_URL:-http://localhost:4000}/health"
check_url "gateway ready" "${GATEWAY_URL:-http://localhost:4000}/ready"
check_url "investor portal" "${INVESTOR_PORTAL_URL:-http://localhost:4001}/"
check_url "department portal" "${DEPARTMENT_PORTAL_URL:-http://localhost:4002}/"
check_url "public portal" "${PUBLIC_PORTAL_URL:-http://localhost:4003}/"
check_url "case service" "${CASE_SERVICE_URL:-http://localhost:4100}/health"
check_url "ai service" "${AI_SERVICE_BASE_URL:-http://localhost:8000}/health"
check_url "ai advisory" "${AI_ADVISORY_BASE_URL:-${AI_SERVICE_BASE_URL:-http://localhost:8000}}/ai/v1/advisory/health"
check_url "n8n" "${N8N_BASE_URL:-http://localhost:5678}/healthz"
check_url "openapi" "${GATEWAY_URL:-http://localhost:4000}/api/v1/openapi.json"
