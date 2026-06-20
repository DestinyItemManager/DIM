import { Middleware } from '@floating-ui/dom';
import { clamp } from 'es-toolkit';

export interface SidecarOptions {
  /** A selector (relative to the floating element) or element for the sidecar menu. */
  element: HTMLElement | string | null;
}

/**
 * A middleware that places a sidecar menu centered around the arrow, without exceeding the
 * size of the popup. It writes a `marginTop` style directly onto the sidecar element.
 *
 * This relies on the arrow middleware having run first, so it reads `middlewareData.arrow`.
 */
export default function computeSidecarPosition(options: SidecarOptions): Middleware {
  return {
    name: 'computeSidecarPosition',
    options,
    fn({ elements, rects, middlewareData }) {
      const { element } = options;

      // Find the sidecar menu element
      let sidecarMenu: HTMLElement | null;
      if (!element) {
        return {};
      } else if (typeof element === 'string') {
        sidecarMenu = elements.floating.querySelector<HTMLElement>(element);
      } else {
        sidecarMenu = element;
      }

      const arrowData = middlewareData.arrow;
      if (!sidecarMenu || arrowData?.y === undefined) {
        return {};
      }

      const floatingHeight = rects.floating.height;
      const sidecarHeight = sidecarMenu.offsetHeight;
      const arrowCenter = arrowData.y + 5; // arrow is 10px tall

      // Don't let the sidecar be positioned above or below the popup
      const top = clamp(arrowCenter - sidecarHeight / 2, 0, floatingHeight - sidecarHeight);

      // Originally this used translateY, but that caused menus to not work on Safari.
      sidecarMenu.style.marginTop = `${Math.round(top)}px`;

      return {};
    },
  };
}
