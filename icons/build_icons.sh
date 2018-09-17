#!/bin/sh -ex

# Generate all our icon images from SVG. Requires a mac (or a system w/ a shell and rsvg-convert installed).

which rsvg-convert || brew install librsvg

CACHEBREAKER="6-2018"

for VERSION in release beta dev; do
    rm -rf "./$VERSION"
    rm -rf "./$VERSION-extension"
    mkdir "$VERSION"
    mkdir "$VERSION-extension"
    rsvg-convert -w 16 -h 16 -o "$VERSION-extension/icon16.png" "favicon-$VERSION.svg"
    rsvg-convert -w 16 -h 16 -o "$VERSION/favicon-16x16.png" "favicon-$VERSION.svg"
    rsvg-convert -w 19 -h 19 -o "$VERSION-extension/icon19.png" "favicon-$VERSION.svg"
    rsvg-convert -w 32 -h 32 -o "$VERSION/favicon-32x32.png" "favicon-$VERSION.svg"
    rsvg-convert -w 38 -h 38 -o "$VERSION-extension/icon38.png" "favicon-$VERSION.svg"
    rsvg-convert -w 48 -h 48 -o "$VERSION-extension/icon48.png" "favicon-$VERSION.svg"
    rsvg-convert -w 96 -h 96 -o "$VERSION/favicon-96x96.png" "favicon-$VERSION.svg"
    rsvg-convert -w 128 -h 128 -o "$VERSION-extension/icon128.png" "favicon-$VERSION.svg"
    rsvg-convert -w 180 -h 180 -o "$VERSION/apple-touch-icon.png" "apple-touch-icon-$VERSION.svg"
    rsvg-convert -w 180 -h 180 -o "$VERSION/apple-touch-icon-$CACHEBREAKER.png" "apple-touch-icon-$VERSION.svg"
    rsvg-convert -w 192 -h 192 -o "$VERSION/android-chrome-192x192-$CACHEBREAKER.png" "android-icon-$VERSION.svg"
    rsvg-convert -w 512 -h 512 -o "$VERSION/android-chrome-512x512-$CACHEBREAKER.png" "android-icon-$VERSION.svg"
done
