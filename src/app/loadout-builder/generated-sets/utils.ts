import _ from 'lodash';
import { ArmorSet, StatTypes, LockedMap } from '../types';
import { count } from '../../utils/util';
import { chainComparator, compareBy, Comparator } from 'app/utils/comparators';
import { statKeys } from '../types';
import { statTier } from '../utils';

function getComparatorsForMatchedSetSorting(statOrder: StatTypes[], enabledStats: Set<StatTypes>) {
  const comparators: Comparator<ArmorSet>[] = [];

  comparators.push(compareBy((s: ArmorSet) => -sumEnabledStats(s.stats, enabledStats)));

  statOrder.forEach((statType) => {
    if (enabledStats.has(statType)) {
      comparators.push(compareBy((s: ArmorSet) => -statTier(s.stats[statType])));
    }
  });

  return comparators;
}

export function sortGeneratedSets(
  lockedMap: LockedMap,
  statOrder: StatTypes[],
  enabledStats: Set<StatTypes>,
  sets?: readonly ArmorSet[]
) {
  if (!sets) {
    return;
  }

  // TODO Can these two sorts be merged?
  let matchedSets = Array.from(sets).sort(
    chainComparator(...getComparatorsForMatchedSetSorting(statOrder, enabledStats))
  );

  matchedSets = sortSetsByMostMatchedPerks(matchedSets, lockedMap);

  return matchedSets;
}

/**
 * Sort sets by set with most number of matched perks
 */
function sortSetsByMostMatchedPerks(setMap: readonly ArmorSet[], lockedMap: LockedMap): ArmorSet[] {
  let sortedSets: ArmorSet[] = Array.from(setMap);

  // Prioritize list based on number of matched perks
  Object.keys(lockedMap).forEach((bucket) => {
    const bucketHash = parseInt(bucket, 10);
    const locked = lockedMap[bucketHash];
    // if there are locked perks for this bucket
    if (!locked) {
      return;
    }
    const lockedPerks = locked.filter((lockedItem) => lockedItem.type === 'perk');
    if (!lockedPerks.length) {
      return;
    }
    // Sort based on what sets have the most matched perks
    sortedSets = _.sortBy(
      sortedSets,
      (set) =>
        -_.sumBy(set.armor, (items) => {
          const item = items?.[0];
          if (!item || !item.isDestiny2() || !item.sockets) {
            return 0;
          }

          return count(item.sockets.allSockets, (slot) =>
            slot.plugOptions.some((perk) =>
              lockedPerks.some(
                (lockedPerk) =>
                  lockedPerk.type === 'perk' && lockedPerk.perk.hash === perk.plugDef.hash
              )
            )
          );
        })
    );
  });

  return sortedSets;
}

/**
 * The "Tier" of a set takes into account that each stat only ticks over to a new effective value
 * every 10.
 */
export function calculateTotalTier(stats: ArmorSet['stats']) {
  return _.sum(Object.values(stats).map(statTier));
}

export function sumEnabledStats(stats: ArmorSet['stats'], enabledStats: Set<StatTypes>) {
  return _.sumBy(statKeys, (statType) =>
    enabledStats.has(statType) ? statTier(stats[statType]) : 0
  );
}
