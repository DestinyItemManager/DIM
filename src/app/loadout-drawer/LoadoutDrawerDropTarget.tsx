import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { DimItem } from '../inventory/item-types';
import styles from './LoadoutDrawerDropTarget.m.scss';

export const bucketTypesSelector = createSelector(
  bucketsSelector,
  storesSelector,
  (buckets, stores) =>
    buckets
      ? [
          'postmaster',
          ...Object.values(buckets.byType).flatMap((bucket) => [
            bucket.hash.toString(),
            ...stores.flatMap((store) => `${store.id}-${bucket.hash}`),
          ]),
        ]
      : emptyArray<string>()
);

export default function LoadoutDrawerDropTarget({
  children,
  className,
  onDroppedItem,
}: {
  children?: React.ReactNode;
  className?: string;
  onDroppedItem(item: DimItem): void;
}) {
  const bucketTypes = useSelector(bucketTypesSelector);

  const [{ isOver }, dropRef] = useDrop<DimItem, unknown, { isOver: boolean }>(
    () => ({
      accept: bucketTypes,
      drop: onDroppedItem,
      canDrop: itemCanBeInLoadout,
      collect: (monitor) => ({ isOver: monitor.isOver() && monitor.canDrop() }),
    }),
    [bucketTypes, onDroppedItem]
  );

  return (
    <div
      className={clsx(className, {
        [styles.over]: isOver,
      })}
      ref={dropRef}
    >
      {children}
    </div>
  );
}
