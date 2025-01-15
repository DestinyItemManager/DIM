import { hideItemPopup } from 'app/item-popup/item-popup';
import clsx from 'clsx';
import React from 'react';
import { useDrag } from 'react-dnd';
import { hideDragFixOverlay, showDragFixOverlay } from './DragPerformanceFix';
import styles from './DraggableInventoryItem.m.scss';
import { isDragging$ } from './drag-events';
import { DimItem } from './item-types';

interface Props {
  item: DimItem;
  anyBucket?: boolean;
  children?: React.ReactNode;
}

let dragTimeout: number | null = null;

export default function DraggableInventoryItem({ children, item, anyBucket = false }: Props) {
  const canDrag =
    (!item.location.inPostmaster || item.destinyVersion === 2) && item.notransfer
      ? item.equipment
      : item.equipment || item.bucket.hasTransferDestination;

  const [_collect, dragRef] = useDrag<DimItem>(
    () => ({
      type:
        item.location.inPostmaster || anyBucket
          ? 'postmaster'
          : item.notransfer
            ? `${item.owner}-${item.bucket.hash}`
            : item.bucket.hash.toString(),
      item: () => {
        hideItemPopup();
        dragTimeout = requestAnimationFrame(() => {
          dragTimeout = null;
          showDragFixOverlay();
        });
        isDragging$.next(true);
        return item;
      },
      end: () => {
        if (dragTimeout !== null) {
          cancelAnimationFrame(dragTimeout);
        }
        hideDragFixOverlay();
        isDragging$.next(false);
      },
      canDrag,
    }),
    [item],
  );

  return (
    <div
      ref={(el) => {
        dragRef(el);
      }}
      className={clsx('item-drag-container', {
        [styles.engram]: item.isEngram,
        [styles.cantDrag]: !canDrag,
      })}
    >
      {children}
    </div>
  );
}
