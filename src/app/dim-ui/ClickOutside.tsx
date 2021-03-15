import { useEventBusListener } from 'app/utils/hooks';
import { EventBus } from 'app/utils/observable';
import React, { useCallback, useContext, useRef } from 'react';

export const ClickOutsideContext = React.createContext(new EventBus<React.MouseEvent>());

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  onClickOutside(event: React.MouseEvent): void;
};

/**
 * Component that fires an event if you click or tap outside of it.
 *
 * This uses a parent element that's connected through context so we can continue to work within the
 * React DOM heirarchy rather than the real one. This is important for things like sheets
 * spawned through portals from the item popup.
 */
export default React.forwardRef(function ClickOutside(
  { onClickOutside, children, ...other }: Props,
  ref: React.RefObject<HTMLDivElement> | null
) {
  const localRef = useRef<HTMLDivElement>(null);
  const wrapperRef = ref || localRef;
  const mouseEvents = useContext(ClickOutsideContext);

  /**
   * Alert if clicked on outside of element
   */
  const handleClickOutside = useCallback(
    (event: React.MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClickOutside(event);
      }
    },
    [onClickOutside, wrapperRef]
  );

  useEventBusListener(mouseEvents, handleClickOutside);

  return (
    <div ref={wrapperRef} {...other}>
      {children}
    </div>
  );
});
