import {
  applyStyles,
  arrow,
  computeStyles,
  flip,
  Instance,
  offset,
  Options,
  Padding,
  Placement,
  popperGenerator,
  popperOffsets,
  preventOverflow,
} from '@popperjs/core';
import computeSidecarPosition from 'app/item-popup/sidecar-popper-modifier';
import _ from 'lodash';
import React, { useLayoutEffect, useRef } from 'react';

// ensure this stays in sync with 'arrow-size' in 'PressTip.m.scss'
const popperArrowSize = 15;

/** Makes a custom popper that doesn't have the event listeners modifier */
const createPopper = popperGenerator({
  defaultModifiers: [
    popperOffsets,
    offset,
    computeStyles,
    applyStyles,
    flip,
    preventOverflow,
    arrow,
    computeSidecarPosition,
  ],
});

const popperOptions = (
  placement: Options['placement'] = 'auto',
  arrowClassName?: string,
  menuClassName?: string,
  boundarySelector?: string,
  offset = arrowClassName ? popperArrowSize / 2 : 0,
  fixed = false
): Partial<Options> => {
  const headerHeight = parseInt(
    document.querySelector('html')!.style.getPropertyValue('--header-height')!,
    10
  );
  const boundaryElement = boundarySelector && document.querySelector(boundarySelector);
  const padding: Padding = {
    left: 10,
    top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
    right: 10,
    bottom: 10,
  };
  const hasArrow = Boolean(arrowClassName);
  const hasMenu = Boolean(menuClassName);
  return {
    strategy: fixed ? 'fixed' : 'absolute',
    placement,
    modifiers: _.compact([
      {
        name: 'preventOverflow',
        options: {
          priority: ['bottom', 'top', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'flip',
        options: {
          behavior: ['top', 'bottom', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, offset],
        },
      },
      hasArrow && {
        name: 'arrow',
        options: {
          element: '.' + arrowClassName,
        },
      },
      hasMenu && {
        name: 'computeSidecarPosition',
        options: {
          element: '.' + menuClassName,
        },
      },
    ]),
  };
};

export function usePopper({
  contents,
  reference,
  arrowClassName,
  menuClassName,
  boundarySelector,
  placement,
  offset,
  fixed,
}: {
  /** A ref to the rendered contents of a popper-positioned item */
  contents: React.RefObject<HTMLElement>;
  /** An ref to the item that triggered the popper, which anchors it */
  reference: React.RefObject<HTMLElement>;
  /** A class used to identify the arrow */
  arrowClassName?: string;
  /** A class used to identify the sidecar menu */
  menuClassName?: string;
  /** An optional additional selector for a "boundary area" */
  boundarySelector?: string;
  /** Placement preference of the popper. Defaults to "auto" */
  placement?: Placement;
  /** Offset of how far from the element to shift the popper. */
  offset?: number;
  /** Is this placed on a fixed item? Workaround for https://github.com/popperjs/popper-core/issues/1156. TODO: make a "positioning context" context value for this */
  fixed?: boolean;
}) {
  const popper = useRef<Instance | undefined>();

  const destroy = () => {
    if (popper.current) {
      try {
        // Work around a popper issue with our custom modifier until we can switch to floating-ui
        popper.current.destroy();
      } catch {}
      popper.current = undefined;
    }
  };

  useLayoutEffect(() => {
    // log('Effect', name, contents.current, reference.current);
    // Reposition the popup as it is shown or if its size changes
    if (!contents.current || !reference.current) {
      return destroy();
    } else {
      if (popper.current) {
        popper.current.update();
      } else {
        const options = popperOptions(
          placement,
          arrowClassName,
          menuClassName,
          boundarySelector,
          offset,
          fixed
        );
        popper.current = createPopper(reference.current, contents.current, options);
        popper.current.update();
      }
    }

    return destroy;
  });
}
