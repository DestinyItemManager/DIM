import { hideItemPopup } from 'app/item-popup/item-popup';
import clsx from 'clsx';
import React from 'react';
import { useDrag } from 'react-dnd';
import { isDragging$ } from './drag-events';
import { DimItem } from './item-types';

interface Props {
  item: DimItem;
  children?: React.ReactNode;
}

let dragTimeout: number | null = null;

export default function DraggableInventoryItem({ children, item }: Props) {
  const [_collected, dragRef] = useDrag<DimItem, unknown, unknown>(
    () => ({
      type: item.location.inPostmaster
        ? 'postmaster'
        : item.notransfer
        ? `${item.owner}-${item.bucket.type}`
        : item.bucket.type!,
      item: () => {
        hideItemPopup();

        dragTimeout = requestAnimationFrame(() => {
          dragTimeout = null;
          document.body.classList.add('drag-perf-show');
        });
        isDragging$.next(true);
        return item;
      },
      end: () => {
        if (dragTimeout !== null) {
          cancelAnimationFrame(dragTimeout);
        }
        document.body.classList.remove('drag-perf-show');
        isDragging$.next(false);
      },
      canDrag: () =>
        (!item.location.inPostmaster || item.destinyVersion === 2) && item.notransfer
          ? item.equipment
          : item.equipment || item.bucket.hasTransferDestination,
    }),
    [item]
  );
  return (
    <div ref={dragRef} className={clsx('item-drag-container', `item-type-${item.type}`)}>
      {children}
    </div>
  );
}
