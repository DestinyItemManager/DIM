import clsx from 'clsx';
import React, { useCallback, useRef } from 'react';
import styles from './SheetHorizontalScrollContainer.m.scss';

// After this many pixels of dragging in either direction, we consider ourselves to be part of a scrolling gesture.
const HORIZ_SCROLL_DRAG_THRESHOLD = 20;
/**
 * We have issues on mobile where horizontal scrolling of flex components doesn't work for some unknown reason. This
 * component is a workaround that captures pointer events when the pointer has been triggered via the down state and
 * has also been moved by HORIZ_SCROLL_DRAG_THRESHOLD pixels. This ensures that button clicks in the component don't
 * get interupted and work as expected.
 */

export function SheetHorizontalScrollContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // This uses pointer events to directly set the scroll position based on dragging the items. This works around an
  // iOS bug around nested draggables, but also is kinda nice on desktop. I wasn't able to get it to do an inertial
  // animation after releasing.
  const ref = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    scrollPosition: number;
    pointerDownPosition: number;
    scrolling: boolean;
  }>(undefined);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't do any of this if the view isn't scrollable in the first place
    if (ref.current!.scrollWidth <= ref.current!.clientWidth) {
      return;
    }

    dragStateRef.current = {
      pointerDownPosition: e.clientX,
      scrollPosition: ref.current!.scrollLeft,
      scrolling: false,
    };
  }, []);
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragStateRef.current = undefined;
    ref.current!.releasePointerCapture(e.pointerId);
  }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStateRef.current !== undefined) {
      const { scrollPosition, pointerDownPosition } = dragStateRef.current;
      // Once we've moved HORIZ_SCROLL_DRAG_THRESHOLD in either direction,
      // constrain to horizontal scrolling only
      dragStateRef.current.scrolling ||=
        Math.abs(e.clientX - pointerDownPosition) > HORIZ_SCROLL_DRAG_THRESHOLD;
      if (dragStateRef.current.scrolling) {
        // Only set the pointer capture once we've moved enough. This allows you
        // to still keep scrolling even if the pointer leaves the scrollable
        // area (which feels nice) but buttons still work. If we always capture
        // in handlePointerDown, buttons won't work because all events get
        // retargeted to the scroll area.
        ref.current!.setPointerCapture(e.pointerId);
        e.stopPropagation();
      }
      ref.current!.scrollLeft = scrollPosition - (e.clientX - pointerDownPosition);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(styles.horizontalScrollContainer, className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
}
