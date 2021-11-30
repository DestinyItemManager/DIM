#!/bin/sh -exu

git config --global user.email "destinyitemmanager@gmail.com"
git config --global user.name "DIM Release Bot"

# bump version (creates tag and version commit)

if [ "$PATCH" = "true" ]; then
    VERSION=$(npm --no-git-tag-version version patch | sed 's/^v//')
else
    VERSION=$(npm --no-git-tag-version version minor | sed 's/^v//')
fi

awk '/## Next/{flag=1;next}/##/{flag=0}flag' docs/CHANGELOG.md >release-notes.txt

# update changelog
OPENSPAN='\<span class="changelog-date"\>'
CLOSESPAN='\<\/span\>'
DATE=$(TZ="America/Los_Angeles" date +"%Y-%m-%d")
perl -i'' -pe"s/^## Next/## Next\n\n## $VERSION $OPENSPAN($DATE)$CLOSESPAN/" docs/CHANGELOG.md

# Add these other changes to the version commit
git add -u
git commit -m"$VERSION"
git tag "v$VERSION"

# build and release using SSH keys
yarn publish:release

# Purge the cache in CloudFlare for long-lived files
curl -X POST "https://api.cloudflare.com/client/v4/zones/2c34c69276ed0f6eb2b9e1518fe56f74/purge_cache" \
-H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
-H "X-Auth-Key: $CLOUDFLARE_KEY" \
-H "Content-Type: application/json" \
--data '{"files":["https://app.destinyitemmanager.com", "https://app.destinyitemmanager.com/index.html", "https://app.destinyitemmanager.com/version.json", "https://app.destinyitemmanager.com/service-worker.js", "https://app.destinyitemmanager.com/gdrive-return.html", "https://app.destinyitemmanager.com/return.html", "https://app.destinyitemmanager.com/manifest-webapp-6-2018.json", "https://app.destinyitemmanager.com/manifest-webapp-6-2018-ios.json"]}'

# push tags and changes
git push --tags origin master:master

# publish a release on GitHub
gh release create "v$VERSION" -F release-notes.txt -t "$VERSION"
