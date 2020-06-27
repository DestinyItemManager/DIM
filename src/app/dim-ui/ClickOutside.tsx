import React, { useContext, useRef, useCallback } from 'react';
import { Subject } from 'rxjs';
import { useSubscription } from 'app/utils/hooks';

export const ClickOutsideContext = React.createContext(new Subject<React.MouseEvent>());

/**
 * Component that fires an event if you click or tap outside of it.
 */
export default function ClickOutside({
  onClickOutside,
  children,
  ref,
  ...other
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement>;
  onClickOutside(event: React.MouseEvent): void;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const wrapperRef = ref || localRef;
  const context = useContext(ClickOutsideContext);

  const subscribeFn = useCallback(() => {
    /**
     * Alert if clicked on outside of element
     */
    const handleClickOutside = (event: React.MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClickOutside(event);
      }
    };
    return context.subscribe(handleClickOutside);
  }, [context, onClickOutside, wrapperRef]);

  useSubscription(subscribeFn);

  return (
    <div ref={wrapperRef} {...other}>
      {children}
    </div>
  );
}
