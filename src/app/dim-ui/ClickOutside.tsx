import { useClickOutside } from 'app/utils/hooks';
import React, { useRef } from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  extraRef?: React.RefObject<HTMLElement>;
  onClickOutside(event: MouseEvent): void;
};

/**
 * Component that fires an event if you click or tap outside of it.
 */
export default React.forwardRef(function ClickOutside(
  { onClickOutside, children, extraRef, ...other }: Props,
  ref: React.RefObject<HTMLDivElement> | null
) {
  const localRef = useRef<HTMLDivElement>(null);
  const wrapperRef = ref || localRef;

  useClickOutside(wrapperRef, onClickOutside, extraRef);

  return (
    <div ref={wrapperRef} {...other}>
      {children}
    </div>
  );
});
