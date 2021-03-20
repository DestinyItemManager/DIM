import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import {
  DestinyClass,
  DestinyEnergyType,
  DestinyProfileResponse,
  TierType,
} from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { ProcessItem } from './processWorker/types';
import { LockedItemType, LockedMod, statValues } from './types';

/**
 *  Filter out plugs that we don't want to show in the perk picker. We only want exotic perks.
 */
export function filterPlugs(socket: DimSocket) {
  if (!socket.plugged) {
    return false;
  }

  const plugItem = socket.plugged.plugDef;
  if (!plugItem || !plugItem.plug) {
    return false;
  }

  return (
    plugItem.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics &&
    plugItem.inventory!.tierType === TierType.Exotic
  );
}

/**
 * Add a locked item to the locked item list for a bucket.
 */
export function addLockedItem(
  lockedItem: LockedItemType,
  locked: readonly LockedItemType[] = []
): readonly LockedItemType[] | undefined {
  // Locking an item clears out the other locked properties in that bucket
  if (lockedItem.type === 'item') {
    return [lockedItem];
  }

  // Only add if it's not already there.
  if (!locked.some((existing) => lockedItemsEqual(existing, lockedItem))) {
    const newLockedItems = Array.from(locked);
    newLockedItems.push(lockedItem);
    return newLockedItems;
  }

  return locked.length === 0 ? undefined : locked;
}

/**
 * Remove a locked item from the locked item list for a bucket.
 */
export function removeLockedItem(
  lockedItem: LockedItemType,
  locked: readonly LockedItemType[] = []
): readonly LockedItemType[] | undefined {
  // Filter anything equal to the passed in item
  const newLockedItems = locked.filter((existing) => !lockedItemsEqual(existing, lockedItem));
  return newLockedItems.length === 0 ? undefined : newLockedItems;
}

export function lockedItemsEqual(first: LockedItemType, second: LockedItemType) {
  switch (first.type) {
    case 'item':
      return second.type === 'item' && first.item.id === second.item.id;
    case 'exclude':
      return second.type === 'exclude' && first.item.id === second.item.id;
    case 'perk':
      return second.type === 'perk' && first.perk.hash === second.perk.hash;
  }
}

/** Whether this item is eligible for being in loadout builder. Now only armour 2.0 and only items that have all the stats. */
export function isLoadoutBuilderItem(item: DimItem) {
  // Armor and Ghosts
  return (
    item.bucket.inArmor &&
    item.energy &&
    statValues.every((statHash) => item.stats?.some((dimStat) => dimStat.statHash === statHash))
  );
}

export function statTier(stat: number) {
  return _.clamp(Math.floor(stat / 10), 0, 10);
}

/**
 * Checks to see if some mod in a collection of LockedMod or LockedMod,
 * has an elemental (non-Any) energy requirement
 */
export function someModHasEnergyRequirement(mods: LockedMod[]) {
  return mods.some(
    (mod) =>
      !mod.modDef.plug.energyCost || mod.modDef.plug.energyCost.energyType !== DestinyEnergyType.Any
  );
}

/**
 * Get the maximum average power for a particular set of armor.
 */
export function getPower(items: DimItem[] | ProcessItem[]) {
  let power = 0;
  let numPoweredItems = 0;
  for (const item of items) {
    if (item.basePower) {
      power += item.basePower;
      numPoweredItems++;
    }
  }

  return Math.floor(power / numPoweredItems);
}

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((mod) => mod.plug.energyCost?.energyType),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name)
);

/** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
export function getUnlockedMods(
  allItems: DimItem[],
  defs: D2ManifestDefinitions,
  profileResponse?: DestinyProfileResponse,
  classType?: DestinyClass
): PluggableInventoryItemDefinition[] {
  const plugSets: { [bucketHash: number]: Set<number> } = {};
  if (!profileResponse || classType === undefined) {
    return [];
  }

  // 1. loop through all items, build up a map of mod sockets by bucket
  for (const item of allItems) {
    if (
      !item ||
      !item.sockets ||
      !isLoadoutBuilderItem(item) ||
      !(item.classType === DestinyClass.Unknown || item.classType === classType)
    ) {
      continue;
    }
    if (!plugSets[item.bucket.hash]) {
      plugSets[item.bucket.hash] = new Set<number>();
    }
    // build the filtered unique perks item picker
    item.sockets.allSockets
      .filter((s) => !s.isPerk)
      .forEach((socket) => {
        if (socket.socketDefinition.reusablePlugSetHash) {
          plugSets[item.bucket.hash].add(socket.socketDefinition.reusablePlugSetHash);
        } else if (socket.socketDefinition.randomizedPlugSetHash) {
          plugSets[item.bucket.hash].add(socket.socketDefinition.randomizedPlugSetHash);
        }
        // TODO: potentially also add inventory-based mods
      });
  }

  // 2. for each unique socket (type?) get a list of unlocked mods
  const allUnlockedMods = Object.values(plugSets).flatMap((sets) => {
    const unlockedPlugs: number[] = [];

    for (const plugSetHash of sets) {
      const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
      for (const plugSetItem of plugSetItems) {
        if (plugIsInsertable(plugSetItem)) {
          unlockedPlugs.push(plugSetItem.plugItemHash);
        }
      }
    }

    const finalMods: PluggableInventoryItemDefinition[] = [];

    for (const plug of unlockedPlugs) {
      const def = defs.InventoryItem.get(plug);

      if (
        isPluggableItem(def) &&
        isArmor2Mod(def) &&
        // Filters out mods that are deprecated.
        (def.plug.insertionMaterialRequirementHash !== 0 || def.plug.energyCost?.energyCost) &&
        // This string can be empty so let those cases through in the event a mod hasn't been given a itemTypeDisplayName.
        // My investigation showed that only classified items had this being undefined.
        def.itemTypeDisplayName !== undefined
      ) {
        finalMods.push(def);
      }
    }

    return finalMods.sort(sortMods);
  });

  return _.uniqBy(allUnlockedMods, (unlocked) => unlocked.hash);
}
