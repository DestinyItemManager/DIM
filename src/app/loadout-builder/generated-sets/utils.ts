import { sumBy } from 'app/utils/collections';
import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import { ArmorSet, ArmorStatHashes, ArmorStats, DesiredStatRange } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(desiredStatRanges: DesiredStatRange[]) {
  const comparators: Comparator<ArmorSet>[] = [
    compareBy((s) => -sumEnabledStats(s.stats, desiredStatRanges)),
  ];

  for (const constraint of desiredStatRanges) {
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
  desiredStatRanges: DesiredStatRange[],
): ArmorSet[] {
  return sets.sort(chainComparator(...getComparatorsForMatchedSetSorting(desiredStatRanges)));
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorStats) {
  return sumBy(Object.values(stats), statTier);
}

export function sumEnabledStats(stats: ArmorStats, desiredStatRanges: DesiredStatRange[]) {
  return sumBy(desiredStatRanges, (constraint) =>
    Math.min(statTier(stats[constraint.statHash as ArmorStatHashes]), constraint.maxTier),
  );
}
