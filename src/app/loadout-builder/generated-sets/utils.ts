import { chainComparator, Comparator, compareBy } from 'app/utils/comparators';
import { ArmorSet } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(statOrder: number[], enabledStats: Set<number>) {
  const comparators: Comparator<ArmorSet>[] = [];

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
  statOrder: number[],
  enabledStats: Set<number>
): ArmorSet[] {
  return sets.sort(
    chainComparator(
      compareBy((set) => -set.enabledTier),
      ...getComparatorsForMatchedSetSorting(statOrder, enabledStats)
    )
  );
}
