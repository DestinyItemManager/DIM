import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { DropTargetHookSpec, useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './LoadoutEditBucketDropTarget.m.scss';

export const bucketTypesSelector = createSelector(
  bucketsSelector,
  storesSelector,
  (buckets, stores) =>
    buckets
      ? Object.values(buckets.byType).flatMap((bucket) =>
          stores.flatMap((store) => [bucket.hash.toString(), `${store.id}-${bucket.hash}`])
        )
      : emptyArray<string>()
);

/**
 * Provides two drop areas (only while dragging) - one for "Equipped" and one for "Unequipped".
 * Dropping an item on one of these targets sends a signal (via monitor.getDropResult()) to the
 * parent LoadoutDrawerDropTarget to give it a hint as to whether to equip the item or not.
 */
export default function LoadoutEditBucketDropTarget({
  children,
  category,
  classType,
}: {
  category: string;
  children?: React.ReactNode;
  classType: DestinyClass;
}) {
  const stores = useSelector(storesSelector);
  const buckets = useSelector(bucketsSelector)!;

  const dropSpec =
    (equipped: boolean) =>
    (): DropTargetHookSpec<
      DimItem,
      { equipped: boolean },
      { isOver: boolean; canDrop: boolean }
    > => ({
      accept: [
        ...buckets.byCategory[category].flatMap((bucket) => [
          bucket.hash.toString(),
          ...stores.flatMap((store) => `${store.id}-${bucket.hash}`),
        ]),
      ],
      drop: () => ({ equipped }),
      canDrop: (i) =>
        itemCanBeInLoadout(i) &&
        (i.classType === DestinyClass.Unknown || classType === i.classType),
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
        canDrop: monitor.canDrop(),
      }),
    });

  const [{ isOver: isOverEquipped, canDrop: canDropEquipped }, equippedRef] = useDrop(
    dropSpec(true),
    [category, stores, buckets]
  );

  const [{ isOver: isOverUnequipped, canDrop: canDropUnequipped }, unequippedRef] = useDrop(
    dropSpec(false),
    [category, stores, buckets]
  );

  return (
    <>
      {(canDropEquipped || canDropUnequipped) && (
        <div className={styles.options}>
          <div
            className={clsx({
              [styles.over]: isOverEquipped,
            })}
            ref={equippedRef}
          >
            {t('Loadouts.Equipped')}
          </div>
          <div
            className={clsx({
              [styles.over]: isOverUnequipped,
            })}
            ref={unequippedRef}
          >
            {t('Loadouts.Unequipped')}
          </div>
        </div>
      )}
      <div className={clsx({ [styles.dragOver]: canDropEquipped || canDropUnequipped })}>
        {children}
      </div>
    </>
  );
}
