import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { ItemFilter } from 'app/search/filter-types';
import { AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { objectValues } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { Dispatch, memo, useCallback, useState } from 'react';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ExcludedItems, LockableBucketHashes, PinnedItems } from '../types';
import ExoticArmorChoice from './ExoticArmorChoice';
import ExoticPicker from './ExoticPicker';
import styles from './LoadoutOptimizerMenuItems.m.scss';
import LockedItem from './LockedItem';

export type ChooseItemFunction = (
  updateFunc: (item: DimItem) => void,
  filter?: ((item: DimItem) => boolean) | undefined,
) => (e: React.MouseEvent) => Promise<void>;

export const LoadoutOptimizerExotic = memo(function LoadoutOptimizerExotic({
  classType,
  lockedExoticHash,
  lbDispatch,
}: {
  classType: DestinyClass;
  lockedExoticHash: number | undefined;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);

  return (
    <>
      <div className={styles.area}>
        {lockedExoticHash !== undefined && (
          <div className={styles.notItemGrid}>
            <ExoticArmorChoice
              lockedExoticHash={lockedExoticHash}
              onClose={() => lbDispatch({ type: 'removeLockedExotic' })}
            />
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={() => setShowExoticPicker(true)}>
            {t('LB.SelectExotic')}
          </button>
        </div>
      </div>
      {showExoticPicker && (
        <ExoticPicker
          lockedExoticHash={lockedExoticHash}
          classType={classType}
          onSelected={(exotic) => lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic })}
          onClose={() => setShowExoticPicker(false)}
        />
      )}
    </>
  );
});

export const LoadoutOptimizerPinnedItems = memo(function LoadoutOptimizerPinnedItems({
  chooseItem,
  selectedStore,
  pinnedItems,
  searchFilter,
  lbDispatch,
}: {
  chooseItem: ChooseItemFunction;
  selectedStore: DimStore;
  pinnedItems: PinnedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
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

  const chooseLockItem = chooseItem(
    pinItem,
    // Exclude types that already have a locked item represented
    (item) => Boolean(!pinnedItems[item.bucket.hash] && searchFilter(item)),
  );

  const allPinnedItems = _.sortBy(_.compact(objectValues(pinnedItems)), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash),
  );

  return (
    <LoadoutBucketDropTarget className={styles.area} onItemLocked={pinItem}>
      {Boolean(allPinnedItems.length) && (
        <div className={styles.itemGrid}>
          {allPinnedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unpinItem} />
          ))}
        </div>
      )}
      <div className={styles.buttons}>
        <button type="button" className="dim-button" onClick={chooseLockItem}>
          <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockItem')}
        </button>
        <button type="button" className="dim-button" onClick={lockEquipped}>
          <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockEquipped')}
        </button>
      </div>
    </LoadoutBucketDropTarget>
  );
});

export const LoadoutOptimizerExcludedItems = memo(function LoadoutOptimizerExcludedItems({
  chooseItem,
  excludedItems,
  searchFilter,
  lbDispatch,
}: {
  chooseItem: ChooseItemFunction;
  excludedItems: ExcludedItems;
  searchFilter: ItemFilter;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const excludeItem = useCallback(
    (item: DimItem) => lbDispatch({ type: 'excludeItem', item }),
    [lbDispatch],
  );
  const unExcludeItem = (item: DimItem) => lbDispatch({ type: 'unexcludeItem', item });

  const chooseExcludeItem = chooseItem(excludeItem, (item) => Boolean(searchFilter(item)));

  const allExcludedItems = _.sortBy(_.compact(objectValues(excludedItems)).flat(), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash),
  );
  return (
    <LoadoutBucketDropTarget className={styles.area} onItemLocked={excludeItem}>
      {Boolean(allExcludedItems.length) && (
        <div className={styles.itemGrid}>
          {allExcludedItems.map((lockedItem) => (
            <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unExcludeItem} />
          ))}
        </div>
      )}
      <div className={styles.buttons}>
        <button type="button" className="dim-button" onClick={chooseExcludeItem}>
          <AppIcon icon={faTimesCircle} /> {t('LoadoutBuilder.ExcludeItem')}
        </button>
      </div>
    </LoadoutBucketDropTarget>
  );
});

export const loMenuSection = styles.area;
