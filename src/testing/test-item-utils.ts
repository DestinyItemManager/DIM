import { DimItem } from 'app/inventory/item-types';
import { BucketHashes } from 'data/d2/generated-enums';

/** a general mod, 4 energy */
export const recoveryModHash = 4204488676; // InventoryItem "Recovery Mod"
/** raid mod, dsc mod */
export const enhancedOperatorAugmentModHash = 817361141; // InventoryItem "Enhanced Operator Augment"
/** class item mod, 3 energy */
export const distributionModHash = 4039026690; // InventoryItem "Distribution"
/** helmet mod, 3 energy */
export const fontOfWisdomModHash = 1130820873; // InventoryItem "Font of Wisdom"

/** 1st class item mod with mutual exclusion behavior, 1 energy */
export const empoweringFinishModHash = 84503918; // InventoryItem "Empowered Finish"
/** 2nd class item mod with mutual exclusion behavior, 1 energy */
export const bulwarkFinishModHash = 4004774874; // InventoryItem "Bulwark Finisher"

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
