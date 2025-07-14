import { sumBy } from 'app/utils/collections';
import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import { ArmorSet, ArmorStatHashes, ArmorStats, DesiredStatRange } from '../types';

function getComparatorsForMatchedSetSorting(desiredStatRanges: DesiredStatRange[]) {
  const comparators: Comparator<ArmorSet>[] = [
    compareBy((s) => -sumEnabledStats(s.stats, desiredStatRanges)),
  ];

  for (const constraint of desiredStatRanges) {
    comparators.push(
      compareBy(
        (s) => -Math.min(s.stats[constraint.statHash as ArmorStatHashes], constraint.maxStat),
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

export function sumEnabledStats(stats: ArmorStats, desiredStatRanges: DesiredStatRange[]) {
  return sumBy(desiredStatRanges, (constraint) =>
    Math.min(stats[constraint.statHash as ArmorStatHashes], constraint.maxStat),
  );
}
