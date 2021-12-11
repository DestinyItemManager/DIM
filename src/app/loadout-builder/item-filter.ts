import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsToCategories } from 'app/loadout/mod-utils';
import { ItemFilter } from 'app/search/filter-types';
import { compareBy } from 'app/utils/comparators';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { doEnergiesMatch } from './mod-utils';
import {
  ExcludedItems,
  ItemsByBucket,
  LockableBucketHash,
  LockableBucketHashes,
  LOCKED_EXOTIC_NO_EXOTIC,
  PinnedItems,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  defs: D2ManifestDefinitions | undefined,
  items: ItemsByBucket | undefined,
  pinnedItems: PinnedItems,
  excludedItems: ExcludedItems,
  lockedMods: PluggableInventoryItemDefinition[],
  lockedExoticHash: number | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  searchFilter: ItemFilter
): ItemsByBucket {
  const filteredItems: {
    [bucketHash in LockableBucketHash]: readonly DimItem[];
  } = {
    [BucketHashes.Helmet]: [],
    [BucketHashes.Gauntlets]: [],
    [BucketHashes.ChestArmor]: [],
    [BucketHashes.LegArmor]: [],
    [BucketHashes.ClassArmor]: [],
  };

  if (!items || !defs) {
    return filteredItems;
  }

  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);

  for (const bucket of LockableBucketHashes) {
    const lockedModsForPlugCategoryHash = lockedModMap[bucketsToCategories[bucket]];

    if (items[bucket]) {
      // There can only be one pinned item as we hide items from the item picker once
      // a single item is pinned
      const pinnedItem = pinnedItems[bucket];
      const exotics = items[bucket].filter((item) => item.hash === lockedExoticHash);

      // We prefer most specific filtering since there can be competing conditions.
      // This means locked item and then exotic
      let firstPassFilteredItems = items[bucket];

      if (pinnedItem) {
        firstPassFilteredItems = [pinnedItem];
      } else if (exotics.length) {
        firstPassFilteredItems = exotics;
      } else if (lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC) {
        firstPassFilteredItems = firstPassFilteredItems.filter((i) => !i.isExotic);
      }

      // Filter out excluded items and items that can't take the bucket specific locked
      // mods energy type
      const excludedAndModsFilteredItems = firstPassFilteredItems.filter(
        (item) =>
          !excludedItems[bucket]?.some((excluded) => item.id === excluded.id) &&
          matchedLockedModEnergy(
            defs,
            item,
            lockedModsForPlugCategoryHash,
            upgradeSpendTier,
            lockItemEnergyType
          ) &&
          hasEnoughSocketsForMods(defs, item, lockedModsForPlugCategoryHash)
      );

      const searchFilteredItems = excludedAndModsFilteredItems.filter(searchFilter);

      filteredItems[bucket] = searchFilteredItems.length
        ? searchFilteredItems
        : excludedAndModsFilteredItems;
    }
  }

  return filteredItems;
}

function matchedLockedModEnergy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  lockedMods: PluggableInventoryItemDefinition[] | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
) {
  if (!lockedMods) {
    return true;
  }
  return lockedMods.every((mod) =>
    doEnergiesMatch(defs, mod, item, upgradeSpendTier, lockItemEnergyType)
  );
}

function hasEnoughSocketsForMods(
  defs: D2ManifestDefinitions,
  item: DimItem,
  lockedMods: PluggableInventoryItemDefinition[]
) {
  if (!lockedMods?.length) {
    return true;
  }

  const sockets = getSocketsByCategoryHash(item.sockets!, SocketCategoryHashes.ArmorMods);
  const plugSets = _.compact(
    sockets.map(
      (socket) =>
        socket.socketDefinition.reusablePlugSetHash &&
        defs.PlugSet.get(socket.socketDefinition.reusablePlugSetHash).reusablePlugItems.map(
          (plugItem) => plugItem.plugItemHash
        )
    )
  ).sort(compareBy((plugHashes) => plugHashes.length));

  for (const mod of lockedMods) {
    const plugSetIndex = plugSets.findIndex((set) => set.includes(mod.hash));
    if (plugSetIndex === -1) {
      return false;
    }
    plugSets.splice(plugSetIndex, 1);
  }

  return true;
}
