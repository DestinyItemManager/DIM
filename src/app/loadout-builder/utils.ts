import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { energyUpgrade } from 'app/inventory/store/energy';
import { UpgradeMaterialHashes } from 'app/search/d2-known-values';
import { warnLog } from 'app/utils/log';
import { DestinyEnergyType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { ProcessItem } from './process-worker/types';
import { LockedItemType } from './types';

// Todo(ryan): Temporary until api types are available
// this is a copy of the initial settings one as we can't have a link
// between the web worker for process and initial settings.
export enum UpgradeSpendTier {
  Nothing,
  LegendaryShards,
  EnhancementPrisms,
  AscendantShardsNotExotic,
  AscendantShards,
  AscendantShardsNotMasterworked,
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
 * Gets a boundary material hash for the spend tier. This is essentially the hash
 * of the next tier up, so we can figure out what the maximum possible upgrade is.
 */
function getEnergySpendTierBoundaryHash(item: DimItem, tier: UpgradeSpendTier) {
  const isExotic = Boolean(item.equippingLabel);
  // Used for figuring out what upgrade is not allowed
  let boundaryHash: number | 'none' = 'none';

  switch (tier) {
    case UpgradeSpendTier.Nothing:
      throw new Error('Please handle this as a special case, no upgrades are allowed.');
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
      // for exotics we allow energy upgrades/swaps using enhancement prisms.
      boundaryHash = UpgradeMaterialHashes.ascendantShard;
      break;
    }
    case UpgradeSpendTier.AscendantShardsNotMasterworked:
      // already masterworked items will have full energy by default, by dropping the boundary
      // we will stop energy swaps
      boundaryHash =
        item.energy?.energyCapacity === 10 ? UpgradeMaterialHashes.ascendantShard : 'none';
      break;
    case UpgradeSpendTier.AscendantShards:
      break;
  }

  return boundaryHash;
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

  if (tier === UpgradeSpendTier.Nothing) {
    return item.energy.energyCapacity;
  }

  const boundaryHash = getEnergySpendTierBoundaryHash(item, tier);

  // gets all possible energy upgrades for the item, including the current level
  // we need this to populate previous item in the loops below
  const availableEnergyUpgrades = energyUpgrade(
    defs,
    item,
    item.energy.energyType,
    item.energy.energyCapacity - 1,
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

  // find the upgrade that uses the boundary material, the one before this will be the max
  // upgrade we can use
  let previousUpgrade: DestinyInventoryItemDefinition | undefined;
  for (const upgrade of availableEnergyUpgrades) {
    const upgradeItem = defs.InventoryItem.get(upgrade);
    const upgradeMaterials = defs.MaterialRequirementSet.get(
      upgradeItem.plug!.insertionMaterialRequirementHash
    );

    // if we find the boundary material we have gone too far
    if (upgradeMaterials.materials.some((material) => material.itemHash === boundaryHash)) {
      break;
    }
    previousUpgrade = upgradeItem;
  }

  const maxUpgradeEnergy = previousUpgrade?.plug?.energyCapacity?.capacityValue || 0;

  return Math.max(item.energy.energyCapacity, maxUpgradeEnergy);
}

/** Figures out whether you can swap energies in the allowed spend tier. */
export function canSwapEnergyFromUpgradeSpendTier(
  defs: D2ManifestDefinitions,
  tier: UpgradeSpendTier,
  item: DimItem
) {
  if (!item.energy || tier === UpgradeSpendTier.Nothing) {
    return false;
  }

  let differentEnergy: DestinyEnergyType;

  // Find any armour energy that is not the current energy
  switch (item.energy.energyType) {
    case DestinyEnergyType.Arc:
      differentEnergy = DestinyEnergyType.Thermal;
      break;
    case DestinyEnergyType.Thermal:
      differentEnergy = DestinyEnergyType.Void;
      break;
    case DestinyEnergyType.Void:
      differentEnergy = DestinyEnergyType.Arc;
      break;
    default: {
      warnLog(
        'loadout-builder',
        `Armor expected to have an energy type of ${DestinyEnergyType.Arc},
        ${DestinyEnergyType.Thermal} or ${DestinyEnergyType.Void} but had
        ${item.energy.energyType}`
      );
      differentEnergy = item.energy.energyType;
    }
  }

  // gets a single upgrade for swapping energy at the current level
  const availableEnergyUpgrades = energyUpgrade(
    defs,
    item,
    item.energy.energyType,
    item.energy.energyCapacity,
    differentEnergy,
    item.energy.energyCapacity
  );

  // if an energy upgrade is not found it means we cannot swap
  if (!availableEnergyUpgrades.length) {
    return false;
  }

  const boundaryHash = getEnergySpendTierBoundaryHash(item, tier);

  if (boundaryHash === 'none') {
    return true;
  }

  const upgrade = defs.InventoryItem.get(availableEnergyUpgrades[0]);
  const upgradeMaterials = defs.MaterialRequirementSet.get(
    upgrade.plug!.insertionMaterialRequirementHash
  );

  // Make sure that the boundary material is not in the necessary upgrade material
  // for example a masterworked item will need ascendant shards, enhancement prisms and
  // legendary shards to swap to another masterwork.
  return upgradeMaterials.materials.every((material) => material.itemHash !== boundaryHash);
}
