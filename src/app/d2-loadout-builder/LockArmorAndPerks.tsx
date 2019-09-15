import React, { useState } from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import {
  filterPlugs,
  isLoadoutBuilderItem,
  addLockedItem,
  removeLockedItem
} from './generated-sets/utils';
import {
  LockableBuckets,
  LockedItemType,
  LockedExclude,
  LockedBurn,
  LockedItemCase,
  ItemsByBucket,
  LockedPerk,
  LockedMap
} from './types';
import { DestinyInventoryItemDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import { RootState } from 'app/store/reducers';
import { DimStore } from 'app/inventory/store-types';
import { AppIcon } from 'app/shell/icons';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons/faPlusCircle';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons/faTimesCircle';
import LoadoutBucketDropTarget from './locked-armor/LoadoutBucketDropTarget';
import { showItemPicker } from 'app/item-picker/item-picker';
import PerkPicker from './PerkPicker';
import ReactDOM from 'react-dom';
import styles from './LockArmorAndPerks.m.scss';
import LockedItem from './LockedItem';

interface ProvidedProps {
  selectedStore: DimStore;
  items: ItemsByBucket;
  lockedMap: LockedMap;
  onLockedMapChanged(lockedMap: ProvidedProps['lockedMap']): void;
}

interface StoreProps {
  buckets: InventoryBuckets;
  perks: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
    }>;
  }>;
  stores: DimStore[];
  isPhonePortrait: boolean;
  language: string;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  const perksSelector = createSelector(
    storesSelector,
    (stores) => {
      const perks: {
        [classType: number]: { [bucketHash: number]: DestinyInventoryItemDefinition[] };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !isLoadoutBuilderItem(item)) {
            continue;
          }
          for (const classType of item.classType === DestinyClass.Unknown
            ? [DestinyClass.Hunter, DestinyClass.Titan, DestinyClass.Warlock]
            : [item.classType]) {
            if (!perks[classType]) {
              perks[classType] = {};
            }
            if (!perks[classType][item.bucket.hash]) {
              perks[classType][item.bucket.hash] = [];
            }
            // build the filtered unique perks item picker
            item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
              socket.plugOptions.forEach((option) => {
                perks[classType][item.bucket.hash].push(option.plugItem);
              });
            });
          }
        }
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((classType) =>
        Object.keys(perks[classType]).forEach((bucket) => {
          const bucketPerks = _.uniq<DestinyInventoryItemDefinition>(perks[classType][bucket]);
          bucketPerks.sort((a, b) => b.index - a.index);
          bucketPerks.sort((a, b) => b.inventory.tierType - a.inventory.tierType);
          perks[classType][bucket] = bucketPerks;
        })
      );

      return perks;
    }
  );

  return (state: RootState): StoreProps => {
    return {
      buckets: state.inventory.buckets!,
      perks: perksSelector(state),
      stores: storesSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait,
      language: state.settings.language
    };
  };
}

/**
 * A control section that allows for locking items and perks, or excluding items from generated sets.
 */
function LockArmorAndPerks({
  selectedStore,
  lockedMap,
  items,
  buckets,
  perks,
  stores,
  language,
  isPhonePortrait,
  onLockedMapChanged
}: Props) {
  const [filterPerksOpen, setFilterPerksOpen] = useState(false);

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () => {
    const newLockedMap: { [bucketHash: number]: LockedItemType[] } = {};
    selectedStore.items.forEach((item) => {
      if (item.equipped && isLoadoutBuilderItem(item)) {
        newLockedMap[item.bucket.hash] = [
          {
            type: 'item',
            item,
            bucket: item.bucket
          }
        ];
      }
    });

    onLockedMapChanged({ ...lockedMap, ...newLockedMap });
  };

  /**
   * Reset all locked items and recompute for all sets
   * Recomputes matched sets
   */
  const resetLocked = () => {
    onLockedMapChanged({});
  };

  const chooseItem = (
    updateFunc: (item: DimItem) => void,
    filter?: (item: DimItem) => boolean
  ) => async (e: React.MouseEvent) => {
    e.preventDefault();

    const order = Object.values(LockableBuckets).map((v) => v.toString());
    try {
      const { item } = await showItemPicker({
        hideStoreEquip: true,
        filterItems: (item: DimItem) =>
          Boolean(
            isLoadoutBuilderItem(item) &&
              item.canBeEquippedBy(selectedStore) &&
              (!filter || filter(item))
          ),
        sortBy: (item) => order.indexOf(item.bucket.id)
      });

      updateFunc(item);
    } catch (e) {}
  };

  const addLockedItemType = (item: LockedItemType) => {
    onLockedMapChanged({
      ...lockedMap,
      [item.bucket.hash]: addLockedItem(item, lockedMap[item.bucket.hash])
    });
  };

  const removeLockedItemType = (item: LockedItemType) => {
    onLockedMapChanged({
      ...lockedMap,
      [item.bucket.hash]: removeLockedItem(item, lockedMap[item.bucket.hash])
    });
  };

  const addLockItem = (item) => addLockedItemType({ type: 'item', item, bucket: item.bucket });
  const addExcludeItem = (item) =>
    addLockedItemType({ type: 'exclude', item, bucket: item.bucket });

  const chooseLockItem = chooseItem(
    addLockItem,
    // Exclude types that already have a locked item represented
    (item) =>
      !lockedMap[item.bucket.id] || !lockedMap[item.bucket.id].some((li) => li.type === 'item')
  );
  const chooseExcludeItem = chooseItem(addExcludeItem);

  let flatLockedMap = _.groupBy(
    Object.values(lockedMap).flatMap((items) => items || []),
    (item) => item.type
  );

  const order = Object.values(LockableBuckets);
  flatLockedMap = _.mapValues(flatLockedMap, (items) =>
    _.sortBy(items, (i: LockedItemCase) => order.indexOf(i.bucket.hash))
  );

  const storeIds = stores.filter((s) => !s.isVault).map((s) => s.id);
  const bucketTypes = buckets.byCategory.Armor.map((b) => b.type!);

  const anyLocked = Object.values(lockedMap).some((lockedItems) =>
    Boolean(lockedItems && lockedItems.length > 0)
  );

  return (
    <div>
      <div className={styles.area}>
        {((flatLockedMap.perk && flatLockedMap.perk.length > 0) ||
          (flatLockedMap.burn && flatLockedMap.burn.length > 0)) && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.perk || []).map((lockedItem: LockedPerk) => (
              <LockedItem
                key={`${lockedItem.bucket.hash}.${lockedItem.perk.hash}`}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
            {(flatLockedMap.burn || []).map((lockedItem: LockedBurn) => (
              <LockedItem
                key={`${lockedItem.bucket.hash}.${lockedItem.burn.dmg}`}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button className="dim-button" onClick={() => setFilterPerksOpen(true)}>
            <AppIcon icon={faPlusCircle} /> {t('LoadoutBuilder.LockPerk')}
          </button>
          {filterPerksOpen &&
            ReactDOM.createPortal(
              <PerkPicker
                perks={perks[selectedStore.classType]}
                items={items}
                lockedMap={lockedMap}
                buckets={buckets}
                language={language}
                isPhonePortrait={isPhonePortrait}
                onClose={() => setFilterPerksOpen(false)}
                onPerksSelected={onLockedMapChanged}
              />,
              document.body
            )}
        </div>
      </div>
      <LoadoutBucketDropTarget
        className={styles.area}
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={addLockItem}
      >
        {!isPhonePortrait && (!flatLockedMap.item || flatLockedMap.item.length === 0) && (
          <div className={styles.dragHelp}>{t('LoadoutBuilder.DropToLock')}</div>
        )}
        {flatLockedMap.item && flatLockedMap.item.length > 0 && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.item || []).map((lockedItem: LockedItemCase) => (
              <LockedItem
                key={lockedItem.item.id}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button className="dim-button" onClick={chooseLockItem}>
            <AppIcon icon={faPlusCircle} /> {t('LoadoutBuilder.LockItem')}
          </button>
          <button className="dim-button" onClick={lockEquipped}>
            <AppIcon icon={faPlusCircle} /> {t('LoadoutBuilder.LockEquipped')}
          </button>
        </div>
      </LoadoutBucketDropTarget>
      <LoadoutBucketDropTarget
        className={styles.area}
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={addExcludeItem}
      >
        {!isPhonePortrait && (!flatLockedMap.exclude || flatLockedMap.exclude.length === 0) && (
          <div className={styles.dragHelp}>{t('LoadoutBuilder.DropToExclude')}</div>
        )}
        {flatLockedMap.exclude && flatLockedMap.exclude.length > 0 && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.exclude || []).map((lockedItem: LockedExclude) => (
              <LockedItem
                key={lockedItem.item.id}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button className="dim-button" onClick={chooseExcludeItem}>
            <AppIcon icon={faTimesCircle} /> {t('LoadoutBuilder.ExcludeItem')}
          </button>
        </div>
      </LoadoutBucketDropTarget>
      {anyLocked && (
        <button className="dim-button" onClick={resetLocked}>
          {t('LoadoutBuilder.ResetLocked')}
        </button>
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(LockArmorAndPerks);
