import { isSteamBrowser } from './browsers';

export function setAppBadge(num?: number) {
  // Steam client updated to a version that crashes when you call setAppBadge
  if ('setAppBadge' in navigator && !isSteamBrowser()) {
    navigator.setAppBadge(num);
  }
}

export function clearAppBadge() {
  // Steam client updated to a version that crashes when you call setAppBadge
  if ('clearAppBadge' in navigator && !isSteamBrowser()) {
    navigator.clearAppBadge();
  }
}
