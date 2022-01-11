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
import { ArrowModifier } from '@popperjs/core/lib/modifiers/arrow';
import { FlipModifier } from '@popperjs/core/lib/modifiers/flip';
import { OffsetModifier } from '@popperjs/core/lib/modifiers/offset';
import { PreventOverflowModifier } from '@popperjs/core/lib/modifiers/preventOverflow';
import _ from 'lodash';
import React, { useLayoutEffect, useRef } from 'react';

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
  ],
});

const popperOptions = (
  placement: Placement = 'auto',
  fallbackPlacements: Placement[] = ['top', 'bottom', 'right', 'left'],
  arrowClassName?: string,
  boundaryElement?: Element,
  offset = arrowClassName ? 5 : 0,
  fixed = false
): Partial<Options> => {
  const headerHeight = parseInt(
    document.querySelector('html')!.style.getPropertyValue('--header-height')!,
    10
  );
  const padding: Padding = {
    left: 10,
    top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
    right: 10,
    bottom: 10,
  };
  const hasArrow = Boolean(arrowClassName);

  const preventOverflowOptions: Partial<PreventOverflowModifier> = {
    name: 'preventOverflow',
    options: {
      boundary: boundaryElement || 'clippingParents',
      padding,
    },
  };
  const flipOptions: Partial<FlipModifier> = {
    name: 'flip',
    options: {
      boundary: boundaryElement || 'clippingParents',
      fallbackPlacements,
      padding,
    },
  };
  const offsetOptions: Partial<OffsetModifier> = {
    name: 'offset',
    options: {
      offset: [0, offset],
    },
  };
  const arrowOptions: Partial<ArrowModifier> | undefined = hasArrow
    ? {
        name: 'arrow',
        options: {
          element: '.' + arrowClassName,
        },
      }
    : undefined;

  return {
    strategy: fixed ? 'fixed' : 'absolute',
    placement,
    modifiers: _.compact([preventOverflowOptions, flipOptions, offsetOptions, arrowOptions]),
  };
};

export function usePopper({
  contents,
  reference,
  arrowClassName,
  boundaryElement,
  placement,
  fallbackPlacements,
  offset,
  fixed,
}: {
  /** A ref to the rendered contents of a popper-positioned item */
  contents: React.RefObject<HTMLElement>;
  /** An ref to the item that triggered the popper, which anchors it */
  reference: React.RefObject<HTMLElement>;
  /** A class used to identify the arrow */
  arrowClassName?: string;
  /** An option element to define the boundary area */
  boundaryElement?: Element;
  /** Placement preference of the popper. Defaults to "auto" */
  placement?: Placement;
  fallbackPlacements?: Placement[];
  /** Offset of how far from the element to shift the popper. */
  offset?: number;
  /** Is this placed on a fixed item? Workaround for https://github.com/popperjs/popper-core/issues/1156. TODO: make a "positioning context" context value for this */
  fixed?: boolean;
}) {
  const popper = useRef<Instance | undefined>();

  const destroy = () => {
    if (popper.current) {
      popper.current.destroy();
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
          fallbackPlacements,
          arrowClassName,
          boundaryElement,
          offset,
          fixed
        );
        popper.current = createPopper(reference.current, contents.current, options);
        popper.current.update();
        setTimeout(() => popper.current?.update(), 0); // helps fix arrow position
      }
    }

    return destroy;
  });
}
