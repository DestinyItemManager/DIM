import { armorStats } from 'app/search/d2-known-values';
import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import { ArmorSet, ArmorStatHashes, ArmorStats } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(
  statOrder: ArmorStatHashes[],
  enabledStats: Set<number>
) {
  const comparators: Comparator<ArmorSet>[] = [
    compareBy((s: ArmorSet) => -sumEnabledStats(s.stats, enabledStats)),
  ];

  for (const statHash of statOrder) {
    if (enabledStats.has(statHash)) {
      comparators.push(compareBy((s: ArmorSet) => -statTier(s.stats[statHash])));
    }
  }
  return comparators;
}

/**
 * A final sorting pass over all sets. This should mostly agree with the sorting in the worker,
 * but it may do a final pass over the returned sets to add more stat mods and that requires us
 * to sort again. So just do that here.
 */
export function sortGeneratedSets(
  sets: ArmorSet[],
  statOrder: ArmorStatHashes[],
  enabledStats: Set<number>
): ArmorSet[] {
  return sets.sort(chainComparator(...getComparatorsForMatchedSetSorting(statOrder, enabledStats)));
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorStats) {
  return _.sum(Object.values(stats).map(statTier));
}

export function sumEnabledStats(stats: ArmorStats, enabledStats: Set<number>) {
  return _.sumBy(armorStats, (statHash) =>
    enabledStats.has(statHash) ? statTier(stats[statHash]) : 0
  );
}
