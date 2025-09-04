import { DimItem } from 'app/inventory/item-types';
import { ProcessItem } from './process-worker/types';

/** Gets the effective stat tier from a stat value, clamping between 0-10 */
export function statTier(stat: number) {
  return Math.min(Math.max(Math.floor(stat / 10), 0), 10);
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
