import React from 'react';

// Utilities for browser detection. In general we avoid browser detection in

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

/**
 * Is this an iOS mobile browser (which all use Safari under the covers)?
 */
export function isiOSBrowser() {
  return iOS;
}

/**
 * Firefox makes the baffling decision to bubble clicks on its scrollbars down
 * to page contents. This is the only way I found to distinguish them.
 */
export function isEventFromFirefoxScrollbar(e: React.PointerEvent | React.MouseEvent) {
  if ('originalTarget' in e.nativeEvent) {
    try {
      // The target object is owned by the browser and will throw an exception if you try to access it
      Object.keys((e.nativeEvent as any).originalTarget);
    } catch (e) {
      return true;
    }
  }
  return false;
}
