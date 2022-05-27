import React from 'react';
import ReactDOM from 'react-dom';

/**
 * A guaranteed-present element for attaching temporary elements to instead of
 * document.body. Using document.body triggers expensive style recalcs, at least
 * in Chrome.
 */
export const tempContainer = document.getElementById('temp-container')!;

/**
 * Render the given children near the root of the page instead of in their existing component hierarchy.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  return ReactDOM.createPortal(children, tempContainer);
}
