import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { AddItemButton } from 'app/loadout/loadout-edit/LoadoutEditBucket';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { ItemFilter } from 'app/search/filter-types';
import { compact } from 'app/utils/collections';
import { compareByIndex } from 'app/utils/comparators';
import { objectValues } from 'app/utils/util-types';
import React, { Dispatch, memo, useCallback } from 'react';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorBucketHashes, ExcludedItems, PinnedItems } from '../types';
import * as styles from './LoadoutOptimizerMenuItems.m.scss';
import LockedItem from './LockedItem';

export type ChooseItemFunction = (
  updateFunc: (item: DimItem) => void,
  filter?: (item: DimItem) => boolean,
) => (e: React.MouseEvent) => Promise<void>;

export const LoadoutOptimizerPinnedItems = memo(function LoadoutOptimizerPinnedItems({
  chooseItem,
  selectedStore,
  pinnedItems,
  searchFilter,
  lbDispatch,
  className,
}: {
  chooseItem: ChooseItemFunction;
  selectedStore: DimStore;
  pinnedItems: PinnedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  className?: string;
}) {
  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () =>
    lbDispatch({
      type: 'setPinnedItems',
      items: selectedStore.items.filter((item) => item.equipped && isLoadoutBuilderItem(item)),
    });

  const pinItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'pinItem', item }),
    [lbDispatch],
  );
  const unpinItem = (item: DimItem) => lbDispatch({ type: 'unpinItem', item });
  const clear = () =>
    lbDispatch({
      type: 'setPinnedItems',
      items: [],
    });

  const chooseLockItem = chooseItem(
    pinItem,
    // Exclude types that already have a locked item represented
    (item) => Boolean(!pinnedItems[item.bucket.hash] && searchFilter(item)),
  );

  const allPinnedItems = compact(objectValues(pinnedItems)).sort(
    compareByIndex(ArmorBucketHashes, (i) => i.bucket.hash),
  );

  return (
    <LoadoutEditSection
      className={className}
      title={t('LoadoutBuilder.PinnedItems')}
      onClear={clear}
      onSyncFromEquipped={lockEquipped}
    >
      <LoadoutBucketDropTarget className={styles.area} onItemLocked={pinItem}>
        <div className={styles.itemGrid}>
          {allPinnedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unpinItem} />
          ))}
          <AddItemButton onClick={chooseLockItem} title={t('LoadoutBuilder.LockItem')} />
        </div>
      </LoadoutBucketDropTarget>
    </LoadoutEditSection>
  );
});

export const LoadoutOptimizerExcludedItems = memo(function LoadoutOptimizerExcludedItems({
  chooseItem,
  excludedItems,
  searchFilter,
  lbDispatch,
  className,
}: {
  chooseItem: ChooseItemFunction;
  excludedItems: ExcludedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  className?: string;
}) {
  const excludeItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'excludeItem', item }),
    [lbDispatch],
  );
  const unExcludeItem = (item: DimItem) => lbDispatch({ type: 'unexcludeItem', item });

  const chooseExcludeItem = chooseItem(excludeItem, (item) => Boolean(searchFilter(item)));

  const allExcludedItems = compact(objectValues(excludedItems))
    .flat()
    .sort(compareByIndex(ArmorBucketHashes, (i) => i.bucket.hash));

  const clear = () => lbDispatch({ type: 'clearExcludedItems' });
  return (
    <LoadoutEditSection
      className={className}
      title={t('LoadoutBuilder.ExcludedItems')}
      onClear={clear}
    >
      <LoadoutBucketDropTarget className={styles.area} onItemLocked={excludeItem}>
        <div className={styles.itemGrid}>
          {allExcludedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unExcludeItem} />
          ))}
          <AddItemButton onClick={chooseExcludeItem} title={t('LoadoutBuilder.ExcludeItem')} />
        </div>
      </LoadoutBucketDropTarget>
    </LoadoutEditSection>
  );
});
