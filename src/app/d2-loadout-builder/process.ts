import _ from 'lodash';
import { D2Item } from '../inventory/item-types';
import { LockableBuckets, ArmorSet, StatTypes } from './types';
import { getNumValidSets, getPower } from './generated-sets/utils';

export const statHashes = {
  Mobility: 2996146975,
  Resilience: 392767087,
  Recovery: 1943323491
};

/**
 * This processes all permutations of armor to build sets
 * TODO: This function must be called such that it has has access to `this.setState`
 *
 * @param filteredItems paired down list of items to process sets from
 */
export default function process(filteredItems: { [bucket: number]: D2Item[] }): ArmorSet[] {
  const pstart = performance.now();
  const helms = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.helmet] || [], (i) => -i.basePower),
    byStatMix
  );
  const gaunts = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.gauntlets] || [], (i) => -i.basePower),
    byStatMix
  );
  const chests = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.chest] || [], (i) => -i.basePower),
    byStatMix
  );
  const legs = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.leg] || [], (i) => -i.basePower),
    byStatMix
  );
  const classitems = multiGroupBy(
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
              statChoices: [helmsKey, gauntsKey, chestsKey, legsKey, classItemsKey].map((key) =>
                key.split(',').map((val) => parseInt(val, 10))
              ),
              stats
            };

            for (const stat of set.statChoices) {
              stats.Mobility += stat[0];
              stats.Resilience += stat[1];
              stats.Recovery += stat[2];
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

function multiGroupBy<T>(items: T[], mapper: (item: T) => string[]) {
  const map: { [key: string]: T[] } = {};
  for (const item of items) {
    for (const result of mapper(item)) {
      map[result] = map[result] || [];
      map[result].push(item);
    }
  }
  return map;
}

function byStatMix(item: D2Item) {
  const mixes: string[] = [];

  const stat = item.stats;

  if (!stat || stat.length < 3) {
    return ['0,0,0'];
  }

  if (stat && item.sockets) {
    for (const socket of item.sockets.sockets) {
      if (socket.plugOptions.length > 1) {
        for (const plug of socket.plugOptions) {
          if (plug.plugItem && plug.plugItem.investmentStats.length) {
            const statBonuses = _.mapValues(statHashes, (h) => {
              const stat = plug.plugItem.investmentStats.find((s) => s.statTypeHash === h);
              return stat ? stat.value : 0;
            });

            mixes.push(
              [
                stat[0].base + statBonuses.Mobility,
                stat[1].base + statBonuses.Resilience,
                stat[2].base + statBonuses.Recovery
              ].toString()
            );
          }
        }
      }
    }
  }

  // TODO: should record selected perk?

  if (mixes.length !== 0) {
    return _.uniq(mixes);
  }

  return [[stat[0].value || 0, stat[1].value || 0, stat[2].value || 0].toString()];
}
