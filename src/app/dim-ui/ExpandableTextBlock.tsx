import clsx from 'clsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './ExpandableTextBlock.m.scss';

/**
 * wrapped around some inline content, this crops to a specified number of lines
 * (with a fadeout) and allows the user to click it and show the rest
 *
 * @param linesWhenClosed an integer please. controls how many lines to collapse to
 * @param alreadyOpen allows a parent component to force it open
 */
export function ExpandableTextBlock({
  children,
  linesWhenClosed,
  alreadyOpen,
  className,
}: {
  children: React.ReactNode;
  linesWhenClosed: number;
  alreadyOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setOpen] = useState(alreadyOpen);
  const [closedHeight, setClosedHeight] = useState<number>();
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // measure the element height, with lines clamped, the first time this component exists
  useLayoutEffect(() => {
    setClosedHeight(contentRef.current!.clientHeight);
  }, []);
  // after the element has been measured, if the unclamped text still fits inside clamped height,
  // then clamping wasn't necessary. set isOpen to mark it as, effectively, already opened
  useEffect(() => {
    if (closedHeight && wrapperRef.current!.clientHeight >= contentRef.current!.clientHeight) {
      setOpen(true);
    }
  }, [closedHeight]);

  return (
    <div
      className={clsx(className, styles.textBlockWrapper, { [styles.open]: isOpen })}
      ref={wrapperRef}
      onClick={() => setOpen(true)}
      style={{ height: isOpen ? 'max-content' : closedHeight, overflow: 'hidden' }}
    >
      <div
        ref={contentRef}
        style={
          closedHeight
            ? undefined
            : {
                WebkitLineClamp: linesWhenClosed,
                WebkitBoxOrient: 'vertical',
                display: '-webkit-box',
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
