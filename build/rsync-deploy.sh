#!/bin/sh -exu

REMOTE_SHELL="ssh -i ~/.ssh/dim.rsa -o StrictHostKeyChecking=no"

# SSH preflight: wait until the server is reachable
until $REMOTE_SHELL -o ConnectTimeout=5 "$REMOTE_USER"@"$REMOTE_HOST" "true"; do
  sleep 2
done

# Sync everything but the HTML first, so it's ready to go
rsync dist/ "$REMOTE_USER"@"$REMOTE_HOST":"$REMOTE_PATH" --rsh "$REMOTE_SHELL" --recursive --exclude=*.html --exclude=*.html.br --exclude=service-worker.js --exclude=service-worker.js.br --exclude=version.json --exclude=version.json.br --verbose

# Then sync the HTML which will start using the new content
rsync dist/*.html dist/*.html.br dist/service-worker.js dist/service-worker.js.br dist/version.json dist/version.json.br "$REMOTE_USER"@"$REMOTE_HOST":"$REMOTE_PATH" --rsh "$REMOTE_SHELL" --verbose
