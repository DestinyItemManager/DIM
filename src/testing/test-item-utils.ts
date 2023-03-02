import { DimItem } from 'app/inventory/item-types';
import { BucketHashes } from 'data/d2/generated-enums';

/** any general mod */
export const recoveryModHash = 4204488676;
/** raid mod, dsc mod */
export const enhancedOperatorAugmentModHash = 817361141;
/** class item mod */
export const distributionModHash = 4039026690;

function isArmor2Item(item: DimItem) {
  return item.energy && item.bucket.inArmor && !item.equippingLabel && item.tier === 'Legendary';
}

export function isArmor2Helmet(item: DimItem) {
  return isArmor2Item(item) && item.bucket.hash === BucketHashes.Helmet;
}

export function isArmor2Arms(item: DimItem) {
  return isArmor2Item(item) && item.bucket.hash === BucketHashes.Gauntlets;
}

export function isArmor2Chest(item: DimItem) {
  return isArmor2Item(item) && item.bucket.hash === BucketHashes.ChestArmor;
}

export function isArmor2Legs(item: DimItem) {
  return isArmor2Item(item) && item.bucket.hash === BucketHashes.LegArmor;
}

export function isArmor2ClassItem(item: DimItem) {
  return isArmor2Item(item) && item.bucket.hash === BucketHashes.ClassArmor;
}
