#!/bin/sh -exu

REMOTE_SHELL="ssh -i ~/.ssh/dim.rsa -o StrictHostKeyChecking=no"

# Sync everything but the HTML first, so it's ready to go
rsync dist/ "$REMOTE_HOST":"$REMOTE_PATH" --rsh "$REMOTE_SHELL" --recursive --exclude=*.html --exclude=service-worker.js --exclude=version.json --verbose

# Then sync the HTML which will start using the new content
rsync dist/*.html dist/service-worker.js dist/version.json "$REMOTE_HOST":"$REMOTE_PATH" --rsh "$REMOTE_SHELL" --verbose
