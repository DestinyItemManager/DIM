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
yarn build:release
yarn syntax
./build/rsync-deploy.sh

# push tags and changes
git push --tags origin master:master

# publish a release on GitHub
gh release create "v$VERSION" -F release-notes.txt -t "$VERSION"
