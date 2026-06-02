#!/usr/bin/env bash
# Attach a custom domain to a Worker (auto-creates the DNS record, since the
# zone is on Cloudflare). Idempotent-ish: a 409 "already exists" is tolerated.
#
# Usage: cf-attach-domain.sh <worker-service-name> <hostname>
# Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
set -euo pipefail

service="$1"
hostname="$2"

resp=$(curl -sS -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/domains" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"zone_id\":\"${CLOUDFLARE_ZONE_ID}\",\"hostname\":\"${hostname}\",\"service\":\"${service}\",\"environment\":\"production\"}")

if echo "$resp" | jq -e '.success' >/dev/null; then
  echo "attached ${hostname} -> ${service}"
else
  echo "failed to attach ${hostname}:" >&2
  echo "$resp" | jq . >&2
  exit 1
fi
