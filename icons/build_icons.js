#!/usr/local/bin/node

const { execSync } = require('child_process');
const rimraf = require('rimraf');
const fs = require('fs');
const splash = require('./splash.json');

const CACHEBREAKER = '6-2018';

// Generate all our icon images from SVG. Requires a mac (or a system w/ a shell and rsvg-convert installed).
execSync('which rsvg-convert || brew install librsvg');
for (const VERSION of ['release', 'beta', 'dev']) {
  rimraf.sync(`./${VERSION}`);
  fs.mkdirSync(VERSION);

  for (const size of [16, 32, 96]) {
    execSync(
      `rsvg-convert -w ${size} -h ${size} -o "${VERSION}/favicon-${size}x${size}.png" "favicon-${VERSION}.svg"`
    );
  }

  execSync(
    `rsvg-convert -w 180 -h 180 -o "${VERSION}/apple-touch-icon.png" "apple-touch-icon-${VERSION}.svg"`
  );
  execSync(
    `rsvg-convert -w 180 -h 180 -o "${VERSION}/apple-touch-icon-${CACHEBREAKER}.png" "apple-touch-icon-${VERSION}.svg"`
  );
  execSync(
    `rsvg-convert -w 192 -h 192 -o "${VERSION}/android-chrome-192x192-${CACHEBREAKER}.png" "android-icon-${VERSION}.svg"`
  );
  execSync(
    `rsvg-convert -w 512 -h 512 -o "${VERSION}/android-chrome-512x512-${CACHEBREAKER}.png" "android-icon-${VERSION}.svg"`
  );
  if (VERSION === 'release') {
    execSync(
      `rsvg-convert -w 512 -h 512 -b "#ee6d0d" -o "${VERSION}/android-chrome-mask-512x512-${CACHEBREAKER}.png" "android-icon-${VERSION}.svg"`
    );
  }
}

rimraf.sync('splash');
fs.mkdirSync('splash');

// Generate all splash screens
for (const [_a, _b, _c, _d, w, h] of splash) {
  execSync(`rsvg-convert -w ${w} -h ${h} -a -o "splash/splash-${w}x${h}.png" "splash.svg"`);
  execSync(
    `convert splash/splash-${w}x${h}.png -background "#313233" -gravity center -extent ${w}x${h} splash/splash-${w}x${h}.png`
  );
}
