#!/bin/sh

rsync -aEv --delete common/ ../app/common/
rsync -aEv --delete img/ ../app/img/
rsync -aEv api-manifest/ ../app/scripts/api-manifest/
