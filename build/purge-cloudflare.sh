#!/bin/bash -eux

set -o pipefail

# Set variables CLOUDFLARE_EMAIL, CLOUDFLARE_KEY, and APP_DOMAIN

# Purge the cache in CloudFlare for long-lived files
curl -X POST "https://api.cloudflare.com/client/v4/zones/2c34c69276ed0f6eb2b9e1518fe56f74/purge_cache" \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
    -H "X-Auth-Key: $CLOUDFLARE_KEY" \
    -H "Content-Type: application/json" \
    --data '{"files":["https://'"$APP_DOMAIN"'", "https://'"$APP_DOMAIN"'/index.html", "https://'"$APP_DOMAIN"'/version.json", "https://'"$APP_DOMAIN"'/service-worker.js", "https://'"$APP_DOMAIN"'/return.html", "https://'"$APP_DOMAIN"'/.well-known/assetlinks.json", "https://'"$APP_DOMAIN"'/.well-known/apple-app-site-association", "https://'"$APP_DOMAIN"'/manifest-webapp.json"]}'
