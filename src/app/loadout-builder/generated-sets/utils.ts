import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import { ArmorSet, ArmorStatHashes, ArmorStats, ResolvedStatConstraint } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(statConstraints: ResolvedStatConstraint[]) {
  const comparators: Comparator<ArmorSet>[] = [
    compareBy((s) => -sumEnabledStats(s.stats, statConstraints)),
  ];

  for (const constraint of statConstraints) {
    comparators.push(
      compareBy(
        (s) =>
          -Math.min(statTier(s.stats[constraint.statHash as ArmorStatHashes]), constraint.maxTier),
      ),
    );
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
  statConstraints: ResolvedStatConstraint[],
): ArmorSet[] {
  return sets.sort(chainComparator(...getComparatorsForMatchedSetSorting(statConstraints)));
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorStats) {
  return _.sum(Object.values(stats).map(statTier));
}

export function sumEnabledStats(stats: ArmorStats, statConstraints: ResolvedStatConstraint[]) {
  return _.sumBy(statConstraints, (constraint) =>
    Math.min(statTier(stats[constraint.statHash as ArmorStatHashes]), constraint.maxTier),
  );
}
