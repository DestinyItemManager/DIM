import { DimItem } from 'app/inventory-stores/item-types';
import _ from 'lodash';
import { ProcessItem } from './process-worker/types';

/** Gets the effective stat tier from a stat value, clamping between 0-10 */
export function statTier(stat: number) {
  return _.clamp(Math.floor(stat / 10), 0, 10);
}

/**
 * Gets the stat tier plus a .5, without clamping even when exceeding T10 or going below T0.
 * To be used for display purposed only.
 */
export function statTierWithHalf(stat: number) {
  const base_tier = Math.floor(stat / 10);
  // ensure (-3 mod 10) results in a remainder of 7 and a stat of -0.5
  const point_five = remEuclid(stat, 10) >= 5;
  const sign = base_tier < 0 ? '-' : '';
  return `${sign}${base_tier < 0 && point_five ? Math.abs(base_tier + 1) : Math.abs(base_tier)}${
    point_five ? '.5' : ''
  }`;
}

/**
 * Calculates the remainder of euclidean division `dividend / divisor`,
 * i.e. returns `rem` such that `dividend = divisor * n + rem` and
 * `0 <= rem < |divisor|`.
 * Remainder is always non-negative, behavior differs from `%` for
 * negative dividends. Find comparisons at
 * https://en.wikipedia.org/wiki/Modulo_operation#Variants_of_the_definition
 */
export function remEuclid(dividend: number, divisor: number) {
  return ((dividend % divisor) + divisor) % divisor;
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
