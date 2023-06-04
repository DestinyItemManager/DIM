import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { Key, useRef } from 'react';
import styles from './VirtualList.m.scss';

export interface VirtualListProps {
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
export default function VirtualList({
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
