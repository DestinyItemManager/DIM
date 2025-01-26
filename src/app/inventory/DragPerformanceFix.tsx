import styles from './DragPerformanceFix.m.scss';

/**
 * This is a workaround for sluggish dragging in Chrome on Windows. It may or
 * may not be related to Logitech mouse drivers or high-DPI mice, but in Chrome
 * on Windows only, some users experience a problem where they can drag items,
 * but the drag targets do not get events very quickly, so it may take a second
 * or two of hovering over a drop target to make it light up. This was still a
 * problem as of January 2025.
 *
 * This workaround is to put a full-screen invisible div over the entire app,
 * and then put separate invisible divs over each drop target. That simplifies
 * the hit-testing Chrome has to do, and makes dragging feel normal.
 */
export default function DragPerformanceFix() {
  // Rarely (possibly never in typical usage), a browser will forget to dispatch the dragEnd event
  // So we try not to trap the user here by allowing them to click away the overlay.
  return <div className={styles.dragPerfFix} onClick={hideDragFixOverlay} />;
}

export function showDragFixOverlay() {
  document.body.classList.add(styles.dragPerfShow);
}

export function hideDragFixOverlay() {
  document.body.classList.remove(styles.dragPerfShow);
}
