#!/usr/bin/env bash
#
# Pre-populate manifest-cache/ with the current Destiny manifest for CI tests.
#
# The test harness downloads the manifest itself, but it streams the ~190MB
# per-table definitions through Node's fetch, and that transfer truncates from
# GitHub runners ("Premature close") - see the failures around 2026-06. curl
# pulls the gzipped aggregate (~23MB on the wire) and detects/retries truncated
# transfers, so seeding the cache here lets the in-test cache-hit path take over
# and the fragile in-process download never runs.
set -euo pipefail

cache_dir="manifest-cache"
mkdir -p "$cache_dir"

# The manifest info endpoint is small and reliable; it tells us the versioned
# path of the single combined ("aggregate") manifest file.
manifest_path=$(
  curl -fsS --retry 5 --retry-all-errors --retry-delay 2 \
    https://www.bungie.net/Platform/Destiny2/Manifest/ |
    jq -r '.Response.jsonWorldContentPaths.en'
)
filename=$(basename "$manifest_path")

if [ -f "$cache_dir/$filename" ]; then
  echo "Manifest $filename already cached"
  exit 0
fi

# Download to a temp file and move into place only on success, so an interrupted
# transfer can't leave a partial file that later reads as the cached manifest.
echo "Downloading manifest $filename"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
curl -fSL --compressed --retry 5 --retry-all-errors --retry-delay 2 \
  -o "$tmp" "https://www.bungie.net$manifest_path"
mv "$tmp" "$cache_dir/$filename"
echo "Saved $cache_dir/$filename"
