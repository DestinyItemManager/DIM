import React from 'react';
import './DragPerformanceFix.scss';

function hideOverlay() {
  // Rarely (possibly never in typical usage), a browser will forget to dispatch the dragEnd event
  // So we try not to trap the user here.
  document.body.classList.remove('drag-perf-show');
}

/** This is a workaround for sluggish dragging in Chrome (and possibly other browsers) */
function DragPerformanceFix() {
  return <div className="drag-perf-fix" onClick={hideOverlay} />;
}

export default DragPerformanceFix;
