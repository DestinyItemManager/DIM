import React, { useContext, useRef, useCallback } from 'react';
import { Subject } from 'rxjs';
import { useSubscription } from 'app/utils/hooks';

export const ClickOutsideContext = React.createContext(new Subject<React.MouseEvent>());

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  onClickOutside(event: React.MouseEvent): void;
};

/**
 * Component that fires an event if you click or tap outside of it.
 */
export default React.forwardRef(function ClickOutside(
  { onClickOutside, children, ...other }: Props,
  ref: React.RefObject<HTMLDivElement> | null
) {
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
});
