#!/bin/bash -eux

set -o pipefail

npx sentry-cli releases new "$VERSION" --finalize
npx sentry-cli releases set-commits "$VERSION" --auto
