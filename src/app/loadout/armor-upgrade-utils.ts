import { DimItem } from 'app/inventory/item-types';

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function upgradeSpendTierToMaxEnergy(
  item: DimItem,
  assumedItemEnergy: number,
  assumedExoticEnergy: number
) {
  const itemEnergy = item.energy?.energyCapacity || 1;
  const assumedEnergy = item.isExotic ? assumedExoticEnergy : assumedItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}
