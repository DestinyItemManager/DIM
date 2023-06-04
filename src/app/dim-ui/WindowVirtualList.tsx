import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef } from 'react';
import { VirtualListProps } from './VirtualList';

/**
 * A virtual scrolling list linked to window scroll. e.g. Optimizer sets or Loadouts.
 *
 * @see VirtualList for an element-linked virtual scroller
 */
export default function WindowVirtualList({
  numElements,
  estimatedSize,
  className,
  itemContainerClassName,
  children,
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
  });

  if (numElements === 0) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      className={className}
      ref={parentRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
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
