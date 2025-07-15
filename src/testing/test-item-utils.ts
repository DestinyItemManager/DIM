import { DimItem } from 'app/inventory/item-types';
import { BucketHashes } from 'data/d2/generated-enums';

/** a general mod, 3 energy */
export const classStatModHash = 4204488676; // InventoryItem "Class Mod"
/** raid mod, dsc mod */
export const enhancedOperatorAugmentModHash = 817361141; // InventoryItem "Enhanced Operator Augment"
/** class item mod, 3 energy */
export const reaperModHash = 40751621; // InventoryItem "Reaper"
/** legs mod, 4 energy */
export const stacksOnStacksModHash = 3994043492; // InventoryItem "Stacks on Stacks"
/** legs mod, 3 energy */
export const elementalChargeModHash = 3712696020; // InventoryItem "Elemental Charge"

/** 1st class item mod with mutual exclusion behavior, 1 energy */
export const empoweringFinishModHash = 84503918; // InventoryItem "Empowered Finish"
/** 2nd class item mod with mutual exclusion behavior, 1 energy */
export const bulwarkFinishModHash = 4004774874; // InventoryItem "Bulwark Finisher"

function isArmor2Item(item: DimItem) {
  return item.energy && item.bucket.inArmor && !item.equippingLabel && item.rarity === 'Legendary';
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
