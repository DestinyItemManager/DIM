import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { energyUpgrade } from 'app/inventory/store/energy';
import { UpgradeMaterialHashes } from 'app/search/d2-known-values';
import { DestinyEnergyType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

/**
 * Gets a boundary material hash for the spend tier. This is essentially the hash
 * of the next tier up, so we can figure out what the maximum possible upgrade is.
 */
function getEnergySpendTierBoundaryHash(item: DimItem, tier: UpgradeSpendTier) {
  // Used for figuring out what upgrade is not allowed
  let boundaryHash: number | 'none' = 'none';

  switch (tier) {
    case UpgradeSpendTier.AscendantShardsLockEnergyType:
    case UpgradeSpendTier.Nothing:
      throw new Error('Please handle this as a special case, no upgrades are allowed.');
    case UpgradeSpendTier.LegendaryShards:
      boundaryHash = UpgradeMaterialHashes.enhancementPrism;
      break;
    case UpgradeSpendTier.EnhancementPrisms:
      boundaryHash = UpgradeMaterialHashes.ascendantShard;
      break;
    case UpgradeSpendTier.AscendantShardsNotExotic: {
      if (!item.isExotic) {
        // already masterworked items will have full energy by default, by dropping the boundary
        // we will stop energy swaps
        boundaryHash =
          item.energy?.energyCapacity === 10 ? UpgradeMaterialHashes.ascendantShard : 'none';
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
  item: DimItem,
  lockItemEnergyType: boolean
) {
  if (
    lockItemEnergyType ||
    !item.energy ||
    tier === UpgradeSpendTier.Nothing ||
    tier === UpgradeSpendTier.AscendantShardsLockEnergyType
  ) {
    return false;
  }

  // Find any armour energy that is not the current energy, just so we correctly
  // calculate the cost of a switch.
  const differentEnergy =
    item.energy.energyType === DestinyEnergyType.Arc
      ? DestinyEnergyType.Thermal
      : DestinyEnergyType.Arc;

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
