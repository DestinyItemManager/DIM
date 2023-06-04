import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { Key, useLayoutEffect, useRef } from 'react';
import styles from './VirtualList.m.scss';

interface VirtualListProps {
  numElements: number;
  estimatedSize: number;
  className?: string;
  itemContainerClassName?: string;
  /**
   * The number of items to render above and below the visible area. Increasing
   * this number will increase the amount of time it takes to render the
   * virtualizer, but might decrease the likelihood of seeing slow-rendering
   * blank items at the top and bottom of the virtualizer when scrolling.
   */
  overscan?: number;
  children: (index: number) => React.ReactNode;
  getItemKey: (index: number) => Key;
}

/**
 * A virtual scrolling list linked to a scrollable element. e.g. Item Feed.
 *
 * @see WindowVirtualList for a window-linked virtual scroller.
 */
export function VirtualList({
  numElements,
  estimatedSize,
  className,
  itemContainerClassName,
  overscan,
  children,
  getItemKey,
}: VirtualListProps) {
  // Dynamic-height element-based virtual list code based on https://tanstack.com/virtual/v3/docs/examples/react/dynamic
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: numElements,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize,
    getItemKey,
    overscan,
  });

  if (numElements === 0) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={clsx(className, styles.scrollContainer)}>
      <div
        className={styles.contentsPlaceholder}
        style={{
          height: virtualizer.getTotalSize(),
        }}
      >
        <div
          className={styles.virtualArea}
          style={{
            transform: `translateY(${items[0].start}px)`,
          }}
        >
          {items.map((virtualItem) => (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              className={itemContainerClassName}
              data-index={virtualItem.index}
            >
              {children(virtualItem.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A virtual scrolling list linked to window scroll. e.g. Optimizer sets or Loadouts.
 *
 * @see VirtualList for an element-linked virtual scroller
 */
export function WindowVirtualList({
  numElements,
  estimatedSize,
  className,
  itemContainerClassName,
  children,
  overscan,
  getItemKey,
}: VirtualListProps) {
  // Dynamic-height window-based virtual list code based on https://tanstack.com/virtual/v3/docs/examples/react/dynamic
  const parentRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);
  useLayoutEffect(() => {
    parentOffsetRef.current = parentRef.current?.offsetTop ?? 0;
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: numElements,
    estimateSize: () => estimatedSize,
    scrollMargin: parentOffsetRef.current,
    getItemKey,
    overscan,
  });

  if (numElements === 0) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      className={clsx(className, styles.contentsPlaceholder)}
      ref={parentRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
      }}
    >
      <div
        className={styles.virtualArea}
        style={{
          transform: `translateY(${items[0].start - virtualizer.options.scrollMargin}px)`,
        }}
      >
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            className={itemContainerClassName}
            data-index={virtualItem.index}
          >
            {children(virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
