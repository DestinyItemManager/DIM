import { Modifier, ModifierArguments } from '@popperjs/core';
import getLayoutRect from '@popperjs/core/lib/dom-utils/getLayoutRect';
import { clamp } from 'es-toolkit';

export interface Options {
  element: HTMLElement | string | null;
}

// Calculate a margin that will position the sidecar menu centered around the arrow
function positionMenu({ state }: ModifierArguments<Options>) {
  // @ts-expect-error ts(2339)
  const sidecarMenu = state.elements.sidecar as HTMLElement | undefined;

  // read arrow offset
  const arrowRect = state.modifiersData.arrow;
  if (!sidecarMenu || !arrowRect) {
    return;
  }

  const popperHeight = state.rects.popper.height;

  const sidecarHeight = getLayoutRect(sidecarMenu).height;
  const arrowCenter = (arrowRect.y || 0) + 5; // arrow is 10px tall

  // Don't let the sidecar be positioned above or below the popup
  const top = clamp(arrowCenter - sidecarHeight / 2, 0, popperHeight - sidecarHeight);

  // Originally this used translateY, but that caused menus to not work on Safari.
  state.styles.sidecar = {
    ...state.styles.sidecar,
    marginTop: `${Math.round(top)}px`,
  };
}

// Get the sidecar menu element for use later
function setupMenu({ state, options }: ModifierArguments<Options>) {
  let sidecarElement = options.element;

  // Find menu element
  if (!sidecarElement) {
    return;
  }
  if (typeof sidecarElement === 'string') {
    // @ts-expect-error ts(2322)
    sidecarElement = state.elements.popper.querySelector(sidecarElement)!;

    if (!sidecarElement) {
      return;
    }
  }

  // @ts-expect-error ts(2339)
  state.elements.sidecar = sidecarElement;
}

/**
 * A modifier that places a sidecar menu centered around the arrow, without exceeding the size of the popup.
 */
const computeSidecarPosition: Modifier<'computeSidecarPosition', Options> = {
  name: 'computeSidecarPosition',
  fn: positionMenu,
  effect: setupMenu,
  enabled: true,
  phase: 'beforeWrite',
  requires: ['arrow'],
};

export default computeSidecarPosition;
