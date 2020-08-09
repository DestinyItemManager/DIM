import clsx from 'clsx';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import styles from './ExpandableTextBlock.m.scss';

export function ExpandableTextBlock({
  linesWhenClosed,
  alreadyOpen,
  children,
  className,
}: {
  linesWhenClosed: number;
  alreadyOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setOpen] = useState(alreadyOpen);
  const [closedHeight, setClosedHeight] = useState<number>();
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setClosedHeight(contentRef.current!.clientHeight);
  }, []);
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
