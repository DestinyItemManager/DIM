#!/bin/bash -e

set -o pipefail

find . -type d -name "node_modules" -prune -o -type f -iregex '.*.ts\|.*.js\|.*.tsx\|.*.jsx' -exec ./build/set-mtime-to-md5.sh {} \; && echo Set mtime to MD5 complete!
yarn test
yarn run lint-check

if [ "$TRAVIS_PULL_REQUEST" = "false" ] && [ "$TRAVIS_BRANCH" = "master" ]; then
  # Master builds release to Beta
  openssl aes-256-cbc -K "$encrypted_472c4900477c_key" -iv "$encrypted_472c4900477c_iv" -in config/dim_travis.rsa.enc -out config/dim_travis.rsa -d && chmod 600 config/dim_travis.rsa
  yarn run publish-beta
  VERSION=$(node -p -e "require('./package.json').version + '.' + process.env.TRAVIS_BUILD_NUMBER")
  npx sentry-cli releases new "$VERSION" --finalize
  npx sentry-cli releases set-commits "$VERSION" --auto

  if [[ -n "$CLOUDFLARE_KEY" ]]; then
    curl -X POST "https://api.cloudflare.com/client/v4/zones/2c34c69276ed0f6eb2b9e1518fe56f74/purge_cache" \
        -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
        -H "X-Auth-Key: $CLOUDFLARE_KEY" \
        -H "Content-Type: application/json" \
        --data '{"files":["https://beta.destinyitemmanager.com", "https://beta.destinyitemmanager.com/index.html", "https://beta.destinyitemmanager.com/version.json", "https://beta.destinyitemmanager.com/service-worker.js", "https://beta.destinyitemmanager.com/gdrive-return.html", "https://beta.destinyitemmanager.com/return.html", "https://beta.destinyitemmanager.com/.well-known/assetlinks.json", "https://beta.destinyitemmanager.com/manifest-webapp-6-2018.json", "https://beta.destinyitemmanager.com/manifest-webapp-6-2018-ios.json"]}'
  fi
else
  # PRs should just check if the app builds
  yarn run build-beta
fi
