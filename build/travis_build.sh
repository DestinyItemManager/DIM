#!/bin/bash -e

set -o pipefail

find . -type d -name "node_modules" -prune -o -type f -iregex '.*.ts\|.*.js\|.*.tsx\|.*.jsx' -exec ./build/set-mtime-to-md5.sh {} \; && echo Set mtime to MD5 complete!
yarn test
yarn run lint-check
yarn run build-release

shopt -s dotglob
zip -r ${TRAVIS_TAG}.zip dist/*
