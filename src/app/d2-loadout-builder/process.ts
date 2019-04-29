import _ from 'lodash';
import { D2Item } from '../inventory/item-types';
import { LockableBuckets, ArmorSet, StatTypes } from './types';
import { getNumValidSets, getPower } from './generated-sets/utils';

/**
 * This processes all permutations of armor to build sets
 * TODO: This function must be called such that it has has access to `this.setState`
 *
 * @param filteredItems paired down list of items to process sets from
 */
export default function process(
  filteredItems: { [bucket: number]: D2Item[] },
  useBaseStats: boolean
): ArmorSet[] {
  const pstart = performance.now();
  const helms = _.groupBy(
    _.sortBy(filteredItems[LockableBuckets.helmet] || [], (i) => -i.basePower),
    byStatMix
  );
  const gaunts = _.groupBy(
    _.sortBy(filteredItems[LockableBuckets.gauntlets] || [], (i) => -i.basePower),
    byStatMix
  );
  const chests = _.groupBy(
    _.sortBy(filteredItems[LockableBuckets.chest] || [], (i) => -i.basePower),
    byStatMix
  );
  const legs = _.groupBy(
    _.sortBy(filteredItems[LockableBuckets.leg] || [], (i) => -i.basePower),
    byStatMix
  );
  const classitems = _.groupBy(
    _.sortBy(filteredItems[LockableBuckets.classitem] || [], (i) => -i.basePower),
    byStatMix
  );
  let setMap: ArmorSet[] = [];

  const helmsKeys = Object.keys(helms);
  const gauntsKeys = Object.keys(gaunts);
  const chestsKeys = Object.keys(chests);
  const legsKeys = Object.keys(legs);
  const classItemsKeys = Object.keys(classitems);

  const combos =
    helmsKeys.length *
    gauntsKeys.length *
    chestsKeys.length *
    legsKeys.length *
    classItemsKeys.length;

  if (combos === 0) {
    return [];
  }

  let processedCount = 0;
  for (const helmsKey of helmsKeys) {
    for (const gauntsKey of gauntsKeys) {
      for (const chestsKey of chestsKeys) {
        for (const legsKey of legsKeys) {
          for (const classItemsKey of classItemsKeys) {
            const stats: { [statType in StatTypes]: number } = {
              Mobility: 0,
              Resilience: 0,
              Recovery: 0
            };

            const set: ArmorSet = {
              id: processedCount,
              armor: [
                helms[helmsKey],
                gaunts[gauntsKey],
                chests[chestsKey],
                legs[legsKey],
                classitems[classItemsKey]
              ],
              // TODO: iterate over perk bonus options and add all tier options
              stats
            };

            for (const armor of set.armor) {
              const stat = armor[0].stats;
              if (stat && stat.length) {
                stats.Mobility += (stat[0].value || 0) - ((useBaseStats && stat[0].modsBonus) || 0);
                stats.Resilience +=
                  (stat[1].value || 0) - ((useBaseStats && stat[1].modsBonus) || 0);
                stats.Recovery += (stat[2].value || 0) - ((useBaseStats && stat[2].modsBonus) || 0);
              }
            }

            if (getNumValidSets(set)) {
              setMap.push(set);
            }
            processedCount++;
          }
        }
      }
    }
  }

  // Pre-sort by tier, then power
  setMap = _.sortBy(setMap, (s) => -getPower(s));
  setMap.sort(
    (a, b) =>
      b.stats.Mobility +
      b.stats.Resilience +
      b.stats.Recovery -
      (a.stats.Mobility + a.stats.Resilience + a.stats.Recovery)
  );

  console.log(
    'found',
    Object.keys(setMap).length,
    'sets after processing',
    combos,
    'combinations in',
    performance.now() - pstart,
    'ms'
  );

  return setMap;
}

function byStatMix(item: D2Item, useBaseStats = false) {
  const stat = item.stats;
  if (stat && stat.length >= 3) {
    return [
      (stat[0].value || 0) - ((useBaseStats && stat[0].modsBonus) || 0),
      (stat[1].value || 0) - ((useBaseStats && stat[1].modsBonus) || 0),
      (stat[2].value || 0) - ((useBaseStats && stat[2].modsBonus) || 0)
    ].toString();
  }
  return '0,0,0';
}
