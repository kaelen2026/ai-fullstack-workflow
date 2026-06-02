#!/usr/bin/env bash
# Tear down a PR preview: detach custom domains (removes DNS) and delete the
# web + api Workers. Safe to run if things are already gone.
#
# Usage: cf-teardown-preview.sh <pr-number>
# Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
set -euo pipefail

pr="$1"

for service in "aifw-web-pr-${pr}" "aifw-api-pr-${pr}"; do
  # 1. Detach any custom domains bound to this Worker.
  ids=$(curl -sS \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/domains" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    | jq -r --arg svc "$service" '.result[]? | select(.service==$svc) | .id')

  for id in $ids; do
    curl -sS -X DELETE \
      "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/domains/${id}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" >/dev/null \
      && echo "detached domain ${id} (${service})"
  done

  # 2. Delete the Worker.
  if npx --yes wrangler@4 delete --name "$service" >/dev/null 2>&1; then
    echo "deleted worker ${service}"
  else
    echo "worker ${service} not found (already deleted?)"
  fi
done
