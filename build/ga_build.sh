#!/bin/bash -e

set -o pipefail

# Master builds release to Beta
yarn run publish-beta
VERSION=$(node -p -e "require('./package.json').version + '.' + process.env.GITHUB_RUN_NUMBER")
npx sentry-cli releases new "$VERSION" --finalize
npx sentry-cli releases set-commits "$VERSION" --auto

if [[ -n "$CLOUDFLARE_KEY" ]]; then
  curl -X POST "https://api.cloudflare.com/client/v4/zones/2c34c69276ed0f6eb2b9e1518fe56f74/purge_cache" \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_KEY" \
      -H "Content-Type: application/json" \
      --data '{"files":["https://beta.destinyitemmanager.com", "https://beta.destinyitemmanager.com/index.html", "https://beta.destinyitemmanager.com/version.json", "https://beta.destinyitemmanager.com/service-worker.js", "https://beta.destinyitemmanager.com/return.html", "https://beta.destinyitemmanager.com/.well-known/assetlinks.json", "https://beta.destinyitemmanager.com/manifest-webapp-6-2018.json", "https://beta.destinyitemmanager.com/manifest-webapp-6-2018-ios.json"]}'
fi

