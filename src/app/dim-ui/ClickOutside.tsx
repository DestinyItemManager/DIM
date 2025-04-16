import { useEventBusListener } from 'app/utils/hooks';
import { EventBus } from 'app/utils/observable';
import React, { createContext, use, useCallback, useEffect, useRef } from 'react';

export const ClickOutsideContext = createContext(new EventBus<React.MouseEvent>());

/**
 * Component that fires an event if you click or tap outside of it.
 *
 * This uses a parent element that's connected through context so we can continue to work within the
 * React DOM hierarchy rather than the real one. This is important for things like sheets
 * spawned through portals from the item popup.
 */
export default function ClickOutside({
  onClickOutside,
  children,
  extraRef,
  onClick,
  ref,
  ...other
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  /** An optional second ref that will be excluded from being considered "outside". This is good for preventing the triggering button from double-counting clicks. */
  extraRef?: React.RefObject<HTMLElement | null>;
  onClickOutside: (event: React.MouseEvent | MouseEvent) => void;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  if (ref && !('current' in ref)) {
    throw new Error('only works with a ref object');
  }

  const wrapperRef = ref || localRef;
  const mouseEvents = use(ClickOutsideContext);

  /**
   * Alert if clicked on outside of element
   */
  const handleClickOutside = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !extraRef?.current?.contains(target)
      ) {
        onClickOutside(event);
      }
    },
    [onClickOutside, wrapperRef, extraRef],
  );

  useEventBusListener(mouseEvents, handleClickOutside);

  // Handle clicks directly on the body as always outside. This handles the case where the ClickoutsideRoot doesn't cover the whole screen.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.target === document.body) {
        onClickOutside(e);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  });

  return (
    <div ref={wrapperRef} {...other}>
      {children}
    </div>
  );
}
