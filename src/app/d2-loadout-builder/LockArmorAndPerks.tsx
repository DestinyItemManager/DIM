import React, { useMemo } from 'react';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { toggleLockedItem, getFilteredAndSelectedPerks, filterPlugs } from './generated-sets/utils';
import LockedArmor from './locked-armor/LockedArmor';
import { LockableBuckets, LockedItemType } from './types';
import PerkAutoComplete from './PerkAutoComplete';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { InventoryBuckets, InventoryBucket } from 'app/inventory/inventory-buckets';
import { D2Item } from 'app/inventory/item-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import { RootState } from 'app/store/reducers';
import { DimStore } from 'app/inventory/store-types';

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
      items: itemsSelector(state)
    };
  };
}

function LockArmorAndPerks(
  this: void,
  { selectedStore, lockedMap, items, buckets, perks, onLockedMapChanged }: Props
) {
  const { selectedPerks, filteredPerks } = useMemo(
    () => getFilteredAndSelectedPerks(selectedStore.classType, lockedMap, items),
    [selectedStore.classType, lockedMap, items]
  );

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

  return (
    <div className="loadout-builder-row mr4 flex space-between">
      <div className="locked-items">
        {Object.values(LockableBuckets).map((armor) => (
          <LockedArmor
            key={armor}
            locked={lockedMap[armor]}
            bucket={buckets.byId[armor]}
            items={items[selectedStore.classType][armor]}
            perks={perks[selectedStore.classType][armor]}
            filteredPerks={filteredPerks}
            onLockChanged={updateLockedArmor}
          />
        ))}
      </div>
      <div className="flex column mb4">
        <button className="dim-button" onClick={lockEquipped}>
          {t('LoadoutBuilder.LockEquipped')}
        </button>
        <button className="dim-button" onClick={resetLocked}>
          {t('LoadoutBuilder.ResetLocked')}
        </button>
        <PerkAutoComplete
          perks={perks[selectedStore.classType]}
          selectedPerks={selectedPerks}
          bucketsById={buckets.byId}
          onSelect={(bucket, item) =>
            toggleLockedItem(
              { type: 'perk', item },
              bucket,
              updateLockedArmor,
              lockedMap[bucket.hash]
            )
          }
        />
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(LockArmorAndPerks);
