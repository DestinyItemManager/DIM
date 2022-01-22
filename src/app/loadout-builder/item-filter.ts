import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketHashToPlugCategoryHash } from 'app/loadout/mod-utils';
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
  LockArmorEnergyType,
  LOCKED_EXOTIC_NO_EXOTIC,
  PinnedItems,
} from './types';

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems({
  defs,
  items,
  pinnedItems,
  excludedItems,
  lockedMods,
  lockedExoticHash,
  lockArmorEnergyType,
  searchFilter,
}: {
  defs: D2ManifestDefinitions | undefined;
  items: ItemsByBucket | undefined;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedMods: PluggableInventoryItemDefinition[];
  lockedExoticHash: number | undefined;
  lockArmorEnergyType?: LockArmorEnergyType;
  searchFilter: ItemFilter;
}): ItemsByBucket {
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
    const lockedModsForPlugCategoryHash = lockedModMap[bucketHashToPlugCategoryHash[bucket]];

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
          matchedLockedModEnergy(item, lockedModsForPlugCategoryHash, lockArmorEnergyType) &&
          hasEnoughSocketsForMods(item, lockedModsForPlugCategoryHash)
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
  item: DimItem,
  lockedMods: PluggableInventoryItemDefinition[] | undefined,
  lockArmorEnergyType?: LockArmorEnergyType
) {
  if (!lockedMods) {
    return true;
  }
  return lockedMods.every((mod) => doEnergiesMatch(mod, item, lockArmorEnergyType));
}

/**
 * This ensures the item has enough sockets for the given mods by checking the plug sets for the items sockets.
 * It does the following
 * 1. Get a list of plugsets from the item sockets and sorts them so the shortest plugsets are used first (needed
 *   for artificer sockets which is a subset of the bucket specific mod sockets)
 * 2. For each locked mod, if it can go into one of the sockets, remove that socket from the list.
 * 3. If we ever can't find a socket, we can't fit them all.
 */
function hasEnoughSocketsForMods(item: DimItem, lockedMods: PluggableInventoryItemDefinition[]) {
  if (!lockedMods?.length) {
    return true;
  }

  const sockets = getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorMods);

  const socketsOrderedWithArtificeFirst = sockets
    // If a socket is not plugged (even with an empty socket) we consider it disabled
    // This needs to be checked as the 30th anniversary armour has the Artifice socket
    // but the API considers it to be disabled.
    .filter((socket) => socket.plugSet && socket.plugged)
    // Artificer sockets only plug a subset of the bucket specific mods so we sort by the size
    // of the plugItems in the plugset so we use that first if possible.
    .sort(compareBy((socket) => socket.plugSet?.plugs.length));

  for (const mod of lockedMods) {
    const socketIndex = socketsOrderedWithArtificeFirst.findIndex((socket) =>
      socket.plugSet?.plugs.some((plug) => plug.plugDef.hash === mod.hash)
    );
    if (socketIndex === -1) {
      return false;
    }
    socketsOrderedWithArtificeFirst.splice(socketIndex, 1);
  }

  return true;
}
