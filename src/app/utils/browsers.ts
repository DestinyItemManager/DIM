// Utilities for browser detection. In general we avoid browser detection in
// favor of feature detection but sometimes you just gotta.

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

/**
 * Is this an iOS mobile browser (which all use Safari under the covers)?
 */
export function isiOSBrowser() {
  return iOS;
}
