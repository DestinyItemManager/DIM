// Steam client updated to a version that crashes when you call setAppBadge
const steam = navigator.userAgent.includes('Steam');

export function setAppBadge(num?: number | undefined) {
  if ('setAppBadge' in navigator && !steam) {
    navigator.setAppBadge(num);
  }
}

export function clearAppBadge() {
  if ('clearAppBadge' in navigator && !steam) {
    navigator.clearAppBadge();
  }
}
