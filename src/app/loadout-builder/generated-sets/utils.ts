import { chainComparator, compareBy } from 'app/utils/comparators';
import { ArmorSet, AutoStatModsSetting } from '../types';

/**
 * A final sorting pass over all sets. This should mostly agree with the sorting in the worker,
 * but it may do a final pass over the returned sets to add more stat mods and that requires us
 * to sort again. So just do that here.
 */
export function sortAndPrepareSets(
  sets: ArmorSet[],
  autoStatMods: AutoStatModsSetting
): ArmorSet[] {
  return sets.sort(
    chainComparator(
      compareBy((set) =>
        autoStatMods === AutoStatModsSetting.Minimums ? -set.enabledBaseTier : -set.enabledTier
      ),
      compareBy((set) => set.statMods.length),
      compareBy((set) => -set.prioritizedTier),
      compareBy((set) => -set.prioritizedPlusFives),
      compareBy((set) => -set.consideredPlusFives)
    )
  );
}
