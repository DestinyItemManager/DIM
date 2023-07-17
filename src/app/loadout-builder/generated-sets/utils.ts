import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { armorStats } from 'app/search/d2-known-values';
import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import { ArmorSet, ArmorStatHashes, ArmorStats } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(statConstraints: StatConstraint[]) {
  const comparators: Comparator<ArmorSet>[] = [
    compareBy((s) => -sumEnabledStats(s.stats, statConstraints)),
  ];

  for (const constraint of statConstraints) {
    comparators.push(compareBy((s) => -statTier(s.stats[constraint.statHash as ArmorStatHashes])));
  }
  return comparators;
}

/**
 * A final sorting pass over all sets. This should mostly agree with the sorting in the worker,
 * but it may do a final pass over the returned sets to add more stat mods and that requires us
 * to sort again. So just do that here.
 */
export function sortGeneratedSets(sets: ArmorSet[], statConstraints: StatConstraint[]): ArmorSet[] {
  return sets.sort(chainComparator(...getComparatorsForMatchedSetSorting(statConstraints)));
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorStats) {
  return _.sum(Object.values(stats).map(statTier));
}

export function sumEnabledStats(stats: ArmorStats, statConstraints: StatConstraint[]) {
  return _.sumBy(armorStats, (statHash) =>
    statConstraints.some((s) => s.statHash === statHash) ? statTier(stats[statHash]) : 0
  );
}
