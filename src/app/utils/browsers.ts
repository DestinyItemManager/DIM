import React from 'react';

// Utilities for browser detection. In general we avoid browser detection but
// some bugs are not directly detectable. Keep user-agent detection here.

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

/**
 * Is this an iOS mobile browser (which all use Safari under the covers)?
 */
export function isiOSBrowser() {
  return iOS;
}

const windows = navigator.platform.includes('Win');

/** Is this a Windows machine? */
export function isWindows() {
  return windows;
}

const appStoreVersion = navigator.userAgent.includes('DIM AppStore');
/** Is this the App Store wrapper version of DIM? */
export function isAppStoreVersion() {
  return appStoreVersion;
}

const steam = navigator.userAgent.includes('Steam');
export function isSteamBrowser() {
  return steam;
}

const mac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export function isMac() {
  return mac;
}

/**
 * Firefox makes the baffling decision to bubble clicks on its scrollbars down
 * to page contents. This is the only way I found to distinguish them.
 */
export function isEventFromFirefoxScrollbar(e: React.PointerEvent | React.MouseEvent) {
  if (e.nativeEvent && 'originalTarget' in e.nativeEvent) {
    try {
      // The target object is owned by the browser and will throw an exception if you try to access it
      Object.keys((e.nativeEvent as any).originalTarget);
    } catch (e) {
      return true;
    }
  }
  return false;
}
