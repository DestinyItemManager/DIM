#!/bin/bash -eux

set -o pipefail

# Create a new release in Sentry for this version
VERSION=$(node -p -e "require('./package.json').version + '.' + (parseInt(process.env.GITHUB_RUN_NUMBER) + 1_000_000)")
npx sentry-cli releases new "$VERSION" --finalize
npx sentry-cli releases set-commits "$VERSION" --auto
