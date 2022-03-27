#!/bin/sh -exu

git config --global user.email "destinyitemmanager@gmail.com"
git config --global user.name "DIM Release Bot"

cat docs/CHANGELOG_NEXT.md docs/CHANGELOG.md >docs/CHANGELOG_TEMP.md              ## Merge CHANGELOG's
mv docs/CHANGELOG_TEMP.md docs/CHANGELOG.md                                       ## Merge CHANGELOG's
cat '## Next\n\n*' >docs/CHANGELOG_NEXT.md                                        ## Reset CHANGELOG_NEXT
awk '/## Next/{flag=1;next}/##/{flag=0}flag' docs/CHANGELOG.md >release-notes.txt ## Generate release-notes.txt

# update changelog
OPENSPAN='\<span class="changelog-date"\>'
CLOSESPAN='\<\/span\>'
DATE=$(TZ="America/Los_Angeles" date +"%Y-%m-%d")
perl -i'' -pe"s/^## Next/## Next\n\n## $VERSION $OPENSPAN($DATE)$CLOSESPAN/" docs/CHANGELOG.md

# Add these other changes to the version commit
git add -u
git commit -m"$VERSION"
git tag "v$VERSION"

# build and check
yarn build:release
yarn syntax

# rsync the files onto the remote host using SSH keys
./build/rsync-deploy.sh

# push tags and changes
git push --tags origin master:master

# publish a release on GitHub
gh release create "v$VERSION" -F release-notes.txt -t "$VERSION"
