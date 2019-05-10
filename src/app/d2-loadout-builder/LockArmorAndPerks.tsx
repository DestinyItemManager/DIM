import React, { useMemo, useState } from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { toggleLockedItem, filterPlugs, getFilteredPerks } from './generated-sets/utils';
import { LockableBuckets, LockedItemType, BurnItem } from './types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { D2Item, DimItem } from 'app/inventory/item-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import { RootState } from 'app/store/reducers';
import { DimStore } from 'app/inventory/store-types';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import { AppIcon } from 'app/shell/icons';
import { faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import LoadoutBucketDropTarget from './locked-armor/LoadoutBucketDropTarget';
import { showItemPicker } from 'app/item-picker/item-picker';
import PerkPicker from './PerkPicker';
import ReactDOM from 'react-dom';

interface ProvidedProps {
  selectedStore: DimStore;
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>;
  onLockedMapChanged(lockedMap: ProvidedProps['lockedMap']): void;
}

interface StoreProps {
  // TODO: only needed for LockArmorAndPerks
  buckets: InventoryBuckets;
  // TODO: only needed for LockArmorAndPerks
  perks: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
    }>;
  }>;
  // TODO: only needed for LockArmorAndPerks
  items: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: Readonly<{ [itemHash: number]: readonly D2Item[] }>;
    }>;
  }>;
  stores: DimStore[];
  isPhonePortrait: boolean;
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
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!perks[item.classType]) {
            perks[item.classType] = {};
          }
          if (!perks[item.classType][item.bucket.hash]) {
            perks[item.classType][item.bucket.hash] = [];
          }

          // build the filtered unique perks item picker
          item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              perks[item.classType][item.bucket.hash].push(option.plugItem);
            });
          });
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

  // TODO: only generate for this class!
  const itemsSelector = createSelector(
    storesSelector,
    (stores) => {
      const items: {
        [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!items[item.classType]) {
            items[item.classType] = {};
          }
          if (!items[item.classType][item.bucket.hash]) {
            items[item.classType][item.bucket.hash] = [];
          }
          if (!items[item.classType][item.bucket.hash][item.hash]) {
            items[item.classType][item.bucket.hash][item.hash] = [];
          }
          items[item.classType][item.bucket.hash][item.hash].push(item);
        }
      }

      return items;
    }
  );

  return (state: RootState): StoreProps => {
    return {
      buckets: state.inventory.buckets!,
      perks: perksSelector(state),
      items: itemsSelector(state),
      stores: storesSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait
    };
  };
}

function LockArmorAndPerks({
  selectedStore,
  lockedMap,
  items,
  buckets,
  perks,
  stores,
  isPhonePortrait,
  onLockedMapChanged
}: Props) {
  const [filterPerksOpen, setFilterPerksOpen] = useState(false);

  const filteredPerks = useMemo(() => getFilteredPerks(selectedStore.classType, lockedMap, items), [
    selectedStore.classType,
    lockedMap,
    items
  ]);

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () => {
    const newLockedMap: { [bucketHash: number]: LockedItemType[] } = {};
    selectedStore.items.forEach((item) => {
      if (item.isDestiny2() && item.equipped && item.bucket.inArmor) {
        newLockedMap[item.bucket.hash] = [
          {
            type: 'item',
            item
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

  /**
   * Adds an item to the locked map bucket
   * Recomputes matched sets
   */
  const updateLockedArmor = (bucket: InventoryBucket, locked: LockedItemType[]) =>
    onLockedMapChanged({ ...lockedMap, [bucket.hash]: locked });

  const setLockedItem = (item: D2Item) => {
    // TODO: check to see that there's not another locked item with that type, and if there is, replace it!
    onLockedMapChanged({
      ...lockedMap,
      [item.bucket.hash]: [
        ...(lockedMap[item.bucket.hash] || []),
        {
          type: 'item',
          item
        }
      ]
    });
  };
  const setExcludedItem = (item: D2Item) => {
    onLockedMapChanged({
      ...lockedMap,
      [item.bucket.hash]: [
        ...(lockedMap[item.bucket.hash] || []),
        {
          type: 'exclude',
          item
        }
      ]
    });
  };

  const chooseItem = (updateFunc: (item: D2Item) => void) => async (e) => {
    e.preventDefault();

    try {
      const { item } = await showItemPicker({
        hideStoreEquip: true,
        filterItems: (item: DimItem) =>
          Boolean(item.bucket.inArmor && item.canBeEquippedBy(selectedStore))
      });

      updateFunc(item as D2Item);
    } catch (e) {}
  };

  const onPerkSelected = (item: LockedItemType, bucket: InventoryBucket) => {
    toggleLockedItem(item, bucket, updateLockedArmor, lockedMap[bucket.hash]);
  };

  const chooseLockItem = chooseItem(setLockedItem);
  const chooseExcludeItem = chooseItem(setExcludedItem);

  let flatLockedMap = _.groupBy(
    Object.values(lockedMap).flatMap((items) => items),
    (item) => item.type
  );

  const order = Object.values(LockableBuckets);
  flatLockedMap = _.mapValues(flatLockedMap, (items, key) =>
    key === 'item' || key === 'exclude'
      ? _.sortBy(items, (i) => order.indexOf((i.item as D2Item).bucket.hash))
      : items
  );

  // TODO: memoooo
  const storeIds = stores.filter((s) => !s.isVault).map((s) => s.id);
  const bucketTypes = buckets.byCategory.Armor.map((b) => b.type!);

  return (
    <div>
      <h3>{t('LoadoutBuilder.SelectLockedItems')}</h3>
      <LoadoutBucketDropTarget
        className="area"
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={setLockedItem}
      >
        {(!flatLockedMap.item || flatLockedMap.item.length === 0) && (
          <div>Drop items here to lock</div>
        )}
        {(flatLockedMap.item || []).map((lockedItem) => (
          <LoadoutBuilderItem
            key={(lockedItem.item as D2Item).id}
            item={lockedItem.item as D2Item}
            locked={[]}
            onExclude={(...args) => console.log(args)}
          />
        ))}
        <button className="dim-button" onClick={chooseLockItem}>
          <AppIcon icon={faPlusCircle} /> Lock Item
        </button>
        <button className="dim-button" onClick={lockEquipped}>
          <AppIcon icon={faPlusCircle} /> {t('LoadoutBuilder.LockEquipped')}
        </button>
      </LoadoutBucketDropTarget>
      <LoadoutBucketDropTarget
        className="area"
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={setExcludedItem}
      >
        {(!flatLockedMap.exclude || flatLockedMap.exclude.length === 0) && (
          <div>Drop items here to exclude</div>
        )}
        {(flatLockedMap.exclude || []).map((lockedItem) => (
          <LoadoutBuilderItem
            key={(lockedItem.item as D2Item).id}
            item={lockedItem.item as D2Item}
            locked={[]}
            onExclude={(...args) => console.log(args)}
          />
        ))}
        <button className="dim-button" onClick={chooseExcludeItem}>
          <AppIcon icon={faTimesCircle} /> Exclude Item
        </button>
      </LoadoutBucketDropTarget>
      <div className="area">
        {(flatLockedMap.perk || []).map((lockedItem) => (
          <BungieImageAndAmmo
            key={(lockedItem.item as DestinyInventoryItemDefinition).index}
            hash={(lockedItem.item as DestinyInventoryItemDefinition).hash}
            className="empty-item"
            title={(lockedItem.item as DestinyInventoryItemDefinition).displayProperties.name}
            src={(lockedItem.item as DestinyInventoryItemDefinition).displayProperties.icon}
          />
        ))}
        {(flatLockedMap.burn || []).map((lockedItem) => (
          <img
            key={(lockedItem.item as BurnItem).index}
            className={`empty-item ${(lockedItem.item as BurnItem).index}`}
            title={(lockedItem.item as BurnItem).displayProperties.name}
            src={(lockedItem.item as BurnItem).displayProperties.icon}
          />
        ))}
        <button className="dim-button" onClick={() => setFilterPerksOpen(true)}>
          <AppIcon icon={faPlusCircle} /> Lock Perk
          {filterPerksOpen &&
            ReactDOM.createPortal(
              <PerkPicker
                perks={perks[selectedStore.classType]}
                filteredPerks={filteredPerks}
                lockedMap={lockedMap}
                buckets={buckets}
                isPhonePortrait={isPhonePortrait}
                onClose={() => setFilterPerksOpen(false)}
                onPerkSelected={onPerkSelected}
              />,
              document.body
            )}
        </button>
      </div>
      <button className="dim-button" onClick={resetLocked}>
        {t('LoadoutBuilder.ResetLocked')}
      </button>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(LockArmorAndPerks);
