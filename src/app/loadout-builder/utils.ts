import { DimItem, DimSocket } from 'app/inventory/item-types';
import { DestinyEnergyType, TierType } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { ProcessItem } from './process-worker/types';
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
