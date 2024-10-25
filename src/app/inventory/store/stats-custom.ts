import { CustomStatWeights } from '@destinyitemmanager/dim-api-types';
import { compact } from 'app/utils/collections';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import { sum } from 'es-toolkit';
import { DimStat } from '../item-types';
import { getStatSortOrder } from './stats';

/**
 * given a set of stat weights, builds a valid armor DimStat
 * by adding up several existing stats (like DIS, MOB, REC)
 * into a stat with the provided name and description.
 *
 * baseOnly true is used to do the classic "custom stat",
 * a user defined stat meant specifically for comparing armor rolls.
 * but it can be false to build a combination stat like "Total"
 */
export function makeCustomStat(
  stats: DimStat[],
  statWeights: CustomStatWeights,
  customStatHash: number,
  customStatName: string,
  customStatDesc: string,
  baseOnly: boolean,
): DimStat | undefined {
  // the following SEVERAL comment lines are regarding weighted stats, which are not enabled right now

  // what's averageNonZeroStatWeight for?
  // we want the effect of all the non-zero multipliers to average out to 1x
  // like STR x 1 / DIS x 2 / MOB x 3 --- to do this --- STR x .5 / DIS x 1 / MOB x 1.5

  // this way, you can exclude a stat by setting it to 0 (which will reduce your total), but
  // among *included* stats, there's no overall bias toward creating higher or lower total,
  // except of course when the item has better values in preferred (heavily weighted) stats

  // also, this way, a weighting that's just 1x's and 0x's, becomes simply
  // "include these" and "exclude these" which is how original custom total works

  // as you make weighting more and more lopsided, the highest weighted stat
  // approaches 2x, and the lowers approach 0, SO: a custom total should top out around
  // the single stat max (42 base) times a 2x weighting multiplier. let's just call it 100
  const nonZeroWeights = compact(Object.values(statWeights));
  if (!nonZeroWeights.length) {
    // everything is zero.... . this is a malformed set of stat weights. skip it.
    return;
  }
  const averageNonZeroStatWeight = sum(nonZeroWeights) / nonZeroWeights.length;

  let weightedBaseTotal = 0;
  let weightedTotal = 0;

  for (const { base, value, statHash } of stats) {
    const multiplier = statWeights[statHash] || 0;
    weightedBaseTotal += base * multiplier;
    weightedTotal += value * multiplier;
  }

  weightedBaseTotal = Math.round(weightedBaseTotal / averageNonZeroStatWeight);
  weightedTotal = Math.round(weightedTotal / averageNonZeroStatWeight);

  return {
    investmentValue: 0,
    statHash: customStatHash,
    displayProperties: {
      name: customStatName,
      description: customStatDesc,
    } as DestinyDisplayPropertiesDefinition,
    sort: getStatSortOrder(customStatHash),
    value: baseOnly ? weightedBaseTotal : weightedTotal,
    base: weightedBaseTotal,
    maximumValue: 1000,
    bar: false,
    smallerIsBetter: false,
    additive: false,
  };
}
