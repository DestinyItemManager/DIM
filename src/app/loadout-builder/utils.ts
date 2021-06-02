import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { energyUpgrade } from 'app/inventory/store/energy';
import { UpgradeMaterialHashes } from 'app/search/d2-known-values';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { ProcessItem } from './process-worker/types';
import { LockedItemType, UpgradeSpendTier } from './types';

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
  }
}

/** Gets the stat tier from a stat value. */
export function statTier(stat: number) {
  return _.clamp(Math.floor(stat / 10), 0, 10);
}

/**
 * Gets the stat tier plus a .5 if stat % 10 >= 5.
 * To be used for display purposed only.
 */
export function statTierWithHalf(stat: number) {
  return `${_.clamp(Math.floor(stat / 10), 0, 10)}${stat % 10 >= 5 ? '.5' : ''}`;
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

/**
 * This function finds the max energy an item can be upgraded to within the allowed spend tier.
 * If it is precisely at the limit for the spend tier, the items energy capacity will be returned.
 * If the item is over the limit for the spend tier 0 will be returned.
 */
function getMaxEnergyFromUpgradeSpendTier(
  defs: D2ManifestDefinitions,
  tier: UpgradeSpendTier,
  item: DimItem
) {
  if (!item.energy) {
    return 0;
  }

  const isExotic = Boolean(item.equippingLabel);
  // Used for figuring out what upgrade is not allowed
  // if undefined there is no boundary
  let boundaryHash: number | 'none' = 'none';

  switch (tier) {
    case UpgradeSpendTier.Nothing:
      // special case, value is 0 so items energy wins out or swap is always disallowed
      return 0;
    case UpgradeSpendTier.LegendaryShards:
      boundaryHash = UpgradeMaterialHashes.enhancementPrism;
      break;
    case UpgradeSpendTier.EnhancementPrisms:
      boundaryHash = UpgradeMaterialHashes.ascendantShard;
      break;
    case UpgradeSpendTier.AscendantShardsNotExotic: {
      if (!isExotic) {
        break;
      }
      boundaryHash = UpgradeMaterialHashes.ascendantShard;
      break;
    }
    case UpgradeSpendTier.AscendantShards:
      break;
  }

  const availableEnergyUpgrades = energyUpgrade(
    defs,
    item,
    item.energy.energyType,
    item.energy.energyCapacity,
    item.energy.energyType,
    10
  );

  // Just get the max possible energy capacity for the item.
  if (boundaryHash === 'none') {
    return Math.max(
      item.energy.energyCapacity,
      ...availableEnergyUpgrades.map(
        (upgradeHash) => defs.InventoryItem.get(upgradeHash).plug!.energyCapacity!.capacityValue
      )
    );
  }

  let previousUpgrade: DestinyInventoryItemDefinition | undefined;
  for (const upgrade of availableEnergyUpgrades) {
    const upgradeItem = defs.InventoryItem.get(upgrade);
    const upgradeMaterials = defs.MaterialRequirementSet.get(
      upgradeItem.plug!.insertionMaterialRequirementHash
    );

    for (const material of upgradeMaterials.materials) {
      if (material.itemHash === boundaryHash) {
        // in the case of no previous upgrade the item must already be on the limit
        return previousUpgrade
          ? previousUpgrade.plug!.energyCapacity!.capacityValue
          : item.energy.energyCapacity;
      }
    }
    previousUpgrade = upgradeItem;
  }

  // should never happen but lets be safe
  return 0;
}

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function upgradeSpendTierToMaxEnergy(
  defs: D2ManifestDefinitions,
  tier: UpgradeSpendTier,
  item: DimItem
) {
  if (!item.energy) {
    return 0;
  }

  return Math.max(item.energy.energyCapacity, getMaxEnergyFromUpgradeSpendTier(defs, tier, item));
}

/** Figures out whether you can swap energies in the allowed spend tier. */
export function canSwapEnergyFromUpgradeSpendTier(
  defs: D2ManifestDefinitions,
  tier: UpgradeSpendTier,
  item: DimItem
) {
  if (!item.energy) {
    return false;
  }
  return item.energy.energyCapacity <= getMaxEnergyFromUpgradeSpendTier(defs, tier, item);
}
