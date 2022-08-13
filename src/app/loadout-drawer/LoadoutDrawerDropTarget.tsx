import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
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
          // TODO: we don't really need every possible bucket right?
          ...Object.values(buckets.byHash).flatMap((bucket) => [
            bucket.hash.toString(),
            ...stores.flatMap((store) => `${store.id}-${bucket.hash}`),
          ]),
        ]
      : emptyArray<string>()
);

export default function LoadoutDrawerDropTarget({
  children,
  className,
  classType,
  onDroppedItem,
}: {
  children?: React.ReactNode;
  className?: string;
  classType: DestinyClass;
  onDroppedItem(item: DimItem, equip?: boolean): void;
}) {
  const bucketTypes = useSelector(bucketTypesSelector);

  const [{ isOver }, dropRef] = useDrop<DimItem, unknown, { isOver: boolean }>(
    () => ({
      accept: bucketTypes,
      drop: (item: DimItem, monitor: DropTargetMonitor<DimItem, { equipped: boolean }>) => {
        const result = monitor.getDropResult();
        onDroppedItem(item, result?.equipped);
      },
      canDrop: (i) =>
        itemCanBeInLoadout(i) &&
        (i.classType === DestinyClass.Unknown || classType === i.classType),
      collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) && monitor.canDrop() }),
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
