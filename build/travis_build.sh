#!/bin/bash -e

set -o pipefail

if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
  # Master builds release to Beta
  openssl aes-256-cbc -K $encrypted_472c4900477c_key -iv $encrypted_472c4900477c_iv -in config/dim_travis.rsa.enc -out config/dim_travis.rsa -d && chmod 600 config/dim_travis.rsa
  yarn run lint-check
  yarn run publish-beta
  VERSION=$(node -p -e "require('./package.json').version + '.' + process.env.TRAVIS_BUILD_NUMBER")
  npx sentry-cli releases new "$VERSION" --finalize
  npx sentry-cli releases set-commits "$VERSION" --auto
else
  # PRs should just check if the app builds
  yarn run lint-check
  yarn run build-beta
fi
