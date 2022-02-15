#!/bin/bash -eux

set -o pipefail

# Create a new release in Sentry for this version
npx sentry-cli releases new "$VERSION" --finalize
npx sentry-cli releases set-commits "$VERSION" --auto
