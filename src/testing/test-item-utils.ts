import { DimItem } from 'app/inventory/item-types';
import { BucketHashes } from 'data/d2/generated-enums';

/** any general mod */
export const recoveryModHash = 2645858828;
/** any legacy mod, nightmare mod */
export const nightmareBreakerModHash = 1560574695;
/** void combat and legacy mod, charged with light first group */
export const protectiveLightModHash = 3523075120;
/** any combat mod, elemental well mod */
export const elementalLightModHash = 2823326549;
/** solar raid mod, dsc mod */
export const enhancedOperatorAugmentModHash = 817361141;
/** void class item mod */
export const perpetuationModHash = 4137020505;
/** any class item mod */
export const distributionModHash = 1513970148;

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
