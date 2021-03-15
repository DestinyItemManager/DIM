import { DimItem, DimSocket } from 'app/inventory/item-types';
import {
  DestinyEnergyType,
  DestinyInventoryItemDefinition,
  TierType,
} from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
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

/**
 * filteredPerks:
 * The input perks, filtered down to perks on items that also include the other selected perks in that bucket.
 * For example, if you'd selected "heavy ammo finder" for class items it would only include perks that are on
 * class items that also had "heavy ammo finder".
 *
 * filteredPlugSetHashes:
 * Plug set hashes that contain the mods that can slot into items that can also slot the other selected mods in that bucket.
 * For example, if you'd selected "scout rifle loader" for gauntlets it would only include mods that can slot on
 * gauntlets that can also slot "scout rifle loader".
 */
export function getFilteredPerksAndPlugSets(
  locked: readonly LockedItemType[] | undefined,
  items: readonly DimItem[]
) {
  const filteredPlugSetHashes = new Set<number>();
  const filteredPerks = new Set<DestinyInventoryItemDefinition>();

  if (!locked) {
    return {};
  }

  for (const item of items) {
    // flat list of plugs per item
    const itemPlugs: DestinyInventoryItemDefinition[] = [];
    // flat list of plugSetHashes per item
    const itemPlugSets: number[] = [];

    if (item.sockets) {
      for (const socket of item.sockets.allSockets) {
        // Populate mods
        if (!socket.isPerk) {
          if (socket.socketDefinition.reusablePlugSetHash) {
            itemPlugSets.push(socket.socketDefinition.reusablePlugSetHash);
          } else if (socket.socketDefinition.randomizedPlugSetHash) {
            itemPlugSets.push(socket.socketDefinition.randomizedPlugSetHash);
          }
        }

        // Populate plugs
        if (filterPlugs(socket)) {
          socket.plugOptions.forEach((option) => {
            itemPlugs.push(option.plugDef);
          });
        }
      }
    }

    // for each item, look to see if all perks match locked
    const matches = locked.every(
      (locked) => locked.type !== 'perk' || itemPlugs.some((plug) => plug.hash === locked.perk.hash)
    );

    // It matches all perks and plugs
    if (matches) {
      for (const plugSetHash of itemPlugSets) {
        filteredPlugSetHashes.add(plugSetHash);
      }
      for (const itemPlug of itemPlugs) {
        filteredPerks.add(itemPlug);
      }
    }
  }

  return { filteredPlugSetHashes, filteredPerks };
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
