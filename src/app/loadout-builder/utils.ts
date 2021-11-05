import { DimItem } from 'app/inventory/item-types';
import _ from 'lodash';
import { ProcessItem } from './process-worker/types';

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
    if (item.power) {
      power += item.power;
      numPoweredItems++;
    }
  }

  return Math.floor(power / numPoweredItems);
}
