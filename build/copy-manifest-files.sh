#!/bin/sh

rsync -aEv --delete common/ ../app/common/
rsync -aEv api-manifest/ ../app/scripts/api-manifest/

