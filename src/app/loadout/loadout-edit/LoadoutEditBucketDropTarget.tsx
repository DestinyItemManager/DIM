import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { AppIcon, equippedIcon, unequippedIcon } from 'app/shell/icons';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { DropTargetHookSpec, useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import styles from './LoadoutEditBucketDropTarget.m.scss';

/**
 * Provides two drop areas (only while dragging) - one for "Equipped" and one for "Unequipped".
 * Dropping an item on one of these targets sends a signal (via monitor.getDropResult()) to the
 * parent LoadoutDrawerDropTarget to give it a hint as to whether to equip the item or not.
 */
export default function LoadoutEditBucketDropTarget({
  children,
  category,
  classType,
  equippedOnly,
}: {
  category: string;
  children?: React.ReactNode;
  classType: DestinyClass;
  equippedOnly?: boolean;
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
      accept:
        category === 'Subclass'
          ? [
              BucketHashes.Subclass.toString(),
              ...stores.flatMap((store) => `${store.id}-${BucketHashes.Subclass}`),
            ]
          : [
              ...buckets.byCategory[category]
                .filter((b) => b.hash !== BucketHashes.Subclass)
                .flatMap((bucket) => [
                  bucket.hash.toString(),
                  ...stores.flatMap((store) => `${store.id}-${bucket.hash}`),
                ]),
            ],
      drop: () => ({ equipped }),
      canDrop: (i) =>
        itemCanBeInLoadout(i) &&
        (i.classType === DestinyClass.Unknown || classType === i.classType) &&
        (equipped || !singularBucketHashes.includes(i.bucket.hash)),
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
          {canDropEquipped && (
            <div
              className={clsx({
                [styles.over]: isOverEquipped,
              })}
              ref={equippedRef}
            >
              <AppIcon className={styles.icon} icon={equippedIcon} />
              {t('Loadouts.Equipped')}
            </div>
          )}
          {!equippedOnly && canDropUnequipped && (
            <div
              className={clsx({
                [styles.over]: isOverUnequipped,
              })}
              ref={unequippedRef}
            >
              <AppIcon className={styles.icon} icon={unequippedIcon} />
              {t('Loadouts.Unequipped')}
            </div>
          )}
        </div>
      )}
      <div className={clsx({ [styles.dragOver]: canDropEquipped || canDropUnequipped })}>
        {children}
      </div>
    </>
  );
}
