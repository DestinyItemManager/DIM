import { DimItem } from 'app/inventory/item-types';
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

function getMaxEnergyFromUpgradeSpendTier(tier: UpgradeSpendTier, item: DimItem) {
  const isExotic = Boolean(item.equippingLabel);

  switch (tier) {
    case UpgradeSpendTier.LegendaryShards:
      return 7;
    case UpgradeSpendTier.EnhancementPrisms:
      return isExotic ? 8 : 9;
    case UpgradeSpendTier.AscendantShardsNotExotic:
      return isExotic ? 8 : 10;
    case UpgradeSpendTier.AscendantShards:
      return 10;
    case UpgradeSpendTier.Nothing:
    default:
      return 0;
  }
}

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function upgradeSpendTierToMaxEnergy(tier: UpgradeSpendTier, item: DimItem) {
  return Math.max(item.energy?.energyCapacity || 0, getMaxEnergyFromUpgradeSpendTier(tier, item));
}

/** Figures out whether you can swap energies in the allowed spend tier. */
export function canSwapEnergyFromUpgradeSpendTier(tier: UpgradeSpendTier, item: DimItem) {
  return (item.energy?.energyCapacity || 0) <= getMaxEnergyFromUpgradeSpendTier(tier, item);
}
