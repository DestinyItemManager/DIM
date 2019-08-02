#!/bin/sh -ex

# Generate all our icon images from SVG. Requires a mac (or a system w/ a shell and rsvg-convert installed).

which rsvg-convert || brew install librsvg

CACHEBREAKER="6-2018"

for VERSION in release beta dev; do
    rm -rf "./$VERSION"
    mkdir "$VERSION"
    rsvg-convert -w 16 -h 16 -o "$VERSION/favicon-16x16.png" "favicon-$VERSION.svg"
    rsvg-convert -w 32 -h 32 -o "$VERSION/favicon-32x32.png" "favicon-$VERSION.svg"
    rsvg-convert -w 96 -h 96 -o "$VERSION/favicon-96x96.png" "favicon-$VERSION.svg"
    rsvg-convert -w 180 -h 180 -o "$VERSION/apple-touch-icon.png" "apple-touch-icon-$VERSION.svg"
    rsvg-convert -w 180 -h 180 -o "$VERSION/apple-touch-icon-$CACHEBREAKER.png" "apple-touch-icon-$VERSION.svg"
    rsvg-convert -w 192 -h 192 -o "$VERSION/android-chrome-192x192-$CACHEBREAKER.png" "android-icon-$VERSION.svg"
    rsvg-convert -w 512 -h 512 -o "$VERSION/android-chrome-512x512-$CACHEBREAKER.png" "android-icon-$VERSION.svg"
done

rm -rf splash
mkdir splash
rsvg-convert -w 640 -h 1136 -o "splash/splash-1136x640.png" "splash.svg"

# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_1136x640.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
#   href="/assets/splash/icon_2436x1125.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_1792x828.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_828x1792.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_1334x750.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
#   href="/assets/splash/icon_1242x2688.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
#   href="/assets/splash/icon_2208x1242.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
#   href="/assets/splash/icon_1125x2436.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
#   href="/assets/splash/icon_1242x2208.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_2732x2048.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
#   href="/assets/splash/icon_2688x1242.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_2224x1668.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_750x1334.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_2048x2732.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_2388x1668.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_1668x2224.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_640x1136.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_1668x2388.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
#   href="/assets/splash/icon_2048x1536.png"
# />
# <link
#   rel="apple-touch-startup-image"
#   media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
#   href="/assets/splash/icon_1536x2048.png"
# />