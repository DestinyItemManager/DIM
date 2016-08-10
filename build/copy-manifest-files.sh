#!/bin/sh

rsync -aEv --delete common/ ../app/common/
rsync -aEv --delete img/ ../app/img/
