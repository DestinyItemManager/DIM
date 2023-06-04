import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef } from 'react';

/**
 * A virtual scrolling list linked to window scroll. e.g. Optimizer sets or Loadouts.
 *
 * @see VirtualList
 */
export default function WindowVirtualList({
  numElements,
  estimatedSize,
  itemContainerClassName,
  children,
}: {
  numElements: number;
  estimatedSize: number;
  itemContainerClassName?: string;
  children: (index: number) => React.ReactNode;
}) {
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
  });

  if (numElements === 0) {
    return null;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
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
