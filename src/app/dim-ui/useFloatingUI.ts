import {
  arrow,
  autoPlacement,
  computePosition,
  flip,
  offset as offsetMiddleware,
  Padding,
  Placement,
  shift,
} from '@floating-ui/dom';
import computeSidecarPosition from 'app/item-popup/sidecar-position-middleware';
import { compact } from 'app/utils/collections';
import React, { useLayoutEffect } from 'react';

// ensure this stays in sync with '$theme-tooltip-arrow-size' in '_variables.scss'
const arrowSize = 8;

export function useFloatingUI(
  {
    contents,
    reference,
    arrowClassName,
    menuClassName,
    boundarySelector,
    placement = 'auto',
    offset,
    fixed,
    padding,
  }: {
    /** A ref to the rendered contents of the floating element */
    contents: React.RefObject<HTMLElement | null>;
    /** A ref to the element that triggered the popup, which anchors it */
    reference: React.RefObject<HTMLElement | null>;
    /** A class used to identify the arrow */
    arrowClassName?: string;
    /** A class used to identify the sidecar menu */
    menuClassName?: string;
    /** An optional additional selector for a "boundary area" */
    boundarySelector?: string;
    /** Placement preference of the floating element. Defaults to "auto" */
    placement?: Placement | 'auto';
    /** Offset of how far to shift the floating element away from the anchor. */
    offset?: number;
    /** Is this placed on a fixed item? */
    fixed?: boolean;
    padding?: Padding;
  },
  deps: React.DependencyList = [],
) {
  useLayoutEffect(() => {
    // Reposition the popup as it is shown or if its size changes
    const contentsElement = contents.current;
    const referenceElement = reference.current;
    if (!contentsElement || !referenceElement) {
      return;
    }

    // Floating UI's computePosition is async, so guard against the elements being
    // torn down before it resolves.
    let cancelled = false;

    const reposition = () => {
      const headerHeight = parseInt(
        document.querySelector('html')!.style.getPropertyValue('--header-height'),
        10,
      );
      const boundaryElement = boundarySelector && document.querySelector(boundarySelector);
      const resolvedPadding: Padding = padding ?? {
        left: 10,
        top: headerHeight + (boundaryElement ? boundaryElement.clientHeight : 0) + 5,
        right: 10,
        bottom: 10,
      };
      const offsetValue = offset ?? (arrowClassName ? arrowSize : 0);
      const isAuto = placement === 'auto';
      const strategy = fixed ? 'fixed' : 'absolute';

      // Floating UI measures the floating element to position it, so it must already
      // be positioned and anchored at a known origin before computePosition runs.
      // Otherwise it's measured while still in normal document flow, which yields
      // incorrect coordinates (notably for flipped placements).
      Object.assign(contentsElement.style, { position: strategy, left: '0', top: '0' });

      const arrowElement = arrowClassName
        ? contentsElement.querySelector<HTMLElement>(`.${arrowClassName}`)
        : null;

      const middleware = compact([
        offsetMiddleware(offsetValue),
        isAuto ? autoPlacement({ padding: resolvedPadding }) : flip({ padding: resolvedPadding }),
        shift({ padding: resolvedPadding }),
        arrowElement && arrow({ element: arrowElement }),
        menuClassName && computeSidecarPosition({ element: `.${menuClassName}` }),
      ]);

      void computePosition(referenceElement, contentsElement, {
        // autoPlacement chooses the side itself, so leave placement at its default
        placement: isAuto ? undefined : placement,
        strategy,
        middleware,
      }).then(({ x, y, placement: finalPlacement, middlewareData }) => {
        if (cancelled) {
          return;
        }
        Object.assign(contentsElement.style, {
          position: strategy,
          left: `${x}px`,
          top: `${y}px`,
        });
        // Expose the resolved placement to CSS (arrow orientation keys off this attribute)
        contentsElement.setAttribute('data-placement', finalPlacement);

        if (arrowElement && middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;
          // Only set the cross-axis offset; the static side is positioned by CSS.
          arrowElement.style.left = arrowX !== undefined ? `${arrowX}px` : '';
          arrowElement.style.top = arrowY !== undefined ? `${arrowY}px` : '';
        }
      });
    };

    reposition();

    return () => {
      cancelled = true;
    };
  }, [
    contents,
    reference,
    arrowClassName,
    menuClassName,
    boundarySelector,
    placement,
    offset,
    fixed,
    padding,

    /**
     * Doing ...deps allows us to pass dependencies from the components that rely on
     * useFloatingUI. Certain popovers are only shown when specific conditions are met,
     * so by making those conditions dependencies we can position the popover
     * correctly once the popover is actually shown.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...deps,
  ]);
}
