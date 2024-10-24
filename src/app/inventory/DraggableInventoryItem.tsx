import { hideItemPopup } from 'app/item-popup/item-popup';
import { useStreamDeckSelection } from 'app/stream-deck/stream-deck';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useDrag } from 'react-dnd';
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
  const selectionProps = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useStreamDeckSelection({
        type: 'item',
        item,
        isSubClass: item.bucket.hash === BucketHashes.Subclass,
        equippable: !item.notransfer,
      })
    : undefined;

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
      canDrag,
    }),
    [item],
  );

  return (
    <div
      ref={dragRef}
      {...selectionProps}
      className={clsx('item-drag-container', {
        [styles.engram]: item.isEngram,
        [styles.cantDrag]: !canDrag,
      })}
    >
      {children}
    </div>
  );
}
