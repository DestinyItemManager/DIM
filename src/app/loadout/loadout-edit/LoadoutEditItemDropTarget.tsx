import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { AppIcon, equippedIcon, unequippedIcon } from 'app/shell/icons';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { DropTargetHookSpec, useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import styles from './LoadoutEditItemDropTarget.m.scss';

/**
 * Provides two drop areas (only while dragging) - one for "Equipped" and one for "Unequipped".
 * Dropping an item on one of these targets sends a signal (via monitor.getDropResult()) to the
 * parent LoadoutDrawerDropTarget to give it a hint as to whether to equip the item or not.
 */
export default function LoadoutEditItemDropTarget({
  children,
  bucket,
  equippedItems,
  unequippedItems,
  classType,
  equip,
}: {
  bucket: InventoryBucket;
  children?: React.ReactNode;
  equippedItems: ResolvedLoadoutItem[];
  unequippedItems: ResolvedLoadoutItem[];
  classType: DestinyClass;
  equip: boolean;
}) {
  const stores = useSelector(storesSelector);

  const [{ isOver, canDrop }, dropRef] = useDrop(
    (): DropTargetHookSpec<
      DimItem,
      { equipped: boolean },
      { isOver: boolean; canDrop: boolean }
    > => ({
      accept: [bucket.hash.toString(), ...stores.flatMap((store) => `${store.id}-${bucket.hash}`)],
      drop: () => ({ equipped: equip }),
      canDrop: (i: DimItem) =>
        itemCanBeInLoadout(i) &&
        (i.classType === DestinyClass.Unknown || classType === i.classType) &&
        (equip || !singularBucketHashes.includes(i.bucket.hash)) &&
        i.bucket.hash === bucket.hash &&
        ((equip && !equippedItems.some((item) => item.item.id === i.id)) ||
          (!equip && !unequippedItems.some((item) => item.item.id === i.id))),
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [bucket, stores, equip, classType, equippedItems, unequippedItems]
  );

  return (
    <div className={styles.dropContainer}>
      {canDrop && (
        <div
          ref={dropRef}
          className={clsx(styles.drop, {
            [styles.over]: isOver,
          })}
        >
          <AppIcon icon={equip ? equippedIcon : unequippedIcon} />
        </div>
      )}
      {!canDrop && <div className={clsx({ [styles.dragOver]: canDrop })}>{children}</div>}
    </div>
  );
}
