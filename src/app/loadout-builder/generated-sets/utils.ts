import { armorStats } from 'app/search/d2-known-values';
import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { ArmorSet, ArmorStats } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(statOrder: number[], enabledStats: Set<number>) {
  const comparators: Comparator<ArmorSet>[] = [];

  comparators.push(compareBy((s: ArmorSet) => -sumEnabledStats(s.stats, enabledStats)));

  for (const statHash of statOrder) {
    if (enabledStats.has(statHash)) {
      comparators.push(compareBy((s: ArmorSet) => -statTier(s.stats[statHash])));
    }
  }

  return comparators;
}

export function sortGeneratedSets(
  statOrder: number[],
  enabledStats: Set<number>,
  sets?: readonly ArmorSet[]
): readonly ArmorSet[] | undefined {
  if (sets === undefined) {
    return;
  }
  if (sets.length === 0) {
    return emptyArray();
  }

  return Array.from(sets).sort(
    chainComparator(...getComparatorsForMatchedSetSorting(statOrder, enabledStats))
  );
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
