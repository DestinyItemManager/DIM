import _ from 'lodash';
import { D2Item } from '../inventory/item-types';
import { LockableBuckets, ArmorSet, StatTypes } from './types';
import { reportException } from '../exceptions';

/**
 * This processes all permutations of armor to build sets
 * TODO: This function must be called such that it has has access to `this.setState`
 *
 * @param filteredItems paired down list of items to process sets from
 */
export default function process(
  filteredItems: { [bucket: number]: D2Item[] },
  useBaseStats: boolean,
  cancelToken: { cancelled: boolean },
  onProgress: (processRunning: number) => void
): Promise<ArmorSet[]> {
  const pstart = performance.now();
  const helms = _.groupBy(filteredItems[LockableBuckets.helmet] || [], byStatMix);
  const gaunts = _.groupBy(filteredItems[LockableBuckets.gauntlets] || [], byStatMix);
  const chests = _.groupBy(filteredItems[LockableBuckets.chest] || [], byStatMix);
  const legs = _.groupBy(filteredItems[LockableBuckets.leg] || [], byStatMix);
  const classitems = _.groupBy(filteredItems[LockableBuckets.classitem] || [], byStatMix);
  const setMap: ArmorSet[] = [];

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
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    function step(h = 0, g = 0, c = 0, l = 0, ci = 0, processedCount = 0) {
      for (; h < helmsKeys.length; ++h) {
        for (; g < gauntsKeys.length; ++g) {
          for (; c < chestsKeys.length; ++c) {
            for (; l < legsKeys.length; ++l) {
              for (; ci < classItemsKeys.length; ++ci) {
                const stats: { [statType in StatTypes]: number } = {
                  Mobility: 0,
                  Resilience: 0,
                  Recovery: 0
                };

                const setHelms = helms[helmsKeys[h]];
                const setGaunts = gaunts[gauntsKeys[g]];
                const setChests = chests[chestsKeys[c]];
                const setLegs = legs[legsKeys[l]];
                const setclassItems = classitems[classItemsKeys[ci]];

                const set: ArmorSet = {
                  id: processedCount,
                  armor: [setHelms, setGaunts, setChests, setLegs, setclassItems],
                  // TODO: iterate over perk bonus options and add all tier options
                  stats
                };

                for (const armor of set.armor) {
                  const stat = armor[0].stats;
                  if (stat && stat.length) {
                    stats.Mobility +=
                      (stat[0].value || 0) - ((useBaseStats && stat[0].modsBonus) || 0);
                    stats.Resilience +=
                      (stat[1].value || 0) - ((useBaseStats && stat[1].modsBonus) || 0);
                    stats.Recovery +=
                      (stat[2].value || 0) - ((useBaseStats && stat[2].modsBonus) || 0);
                  }
                }

                setMap.push(set);
                processedCount++;
                if (cancelToken.cancelled) {
                  console.log('cancelled processing');
                  reject();
                }
                if (processedCount % 10000 === 0) {
                  onProgress(Math.floor((processedCount / combos) * 100));
                  return setTimeout(() => {
                    step(h, g, c, l, ci, processedCount);
                  }, 0);
                }
                ci = 0;
              }
              l = 0;
            }
            c = 0;
          }
          g = 0;
        }

        if (cancelToken.cancelled) {
          console.log('cancelled processing');
          reject();
        }

        console.log(
          'found',
          Object.keys(setMap).length,
          'sets after processing',
          combos,
          'combinations in',
          performance.now() - pstart,
          processedCount
        );

        // Pre-sort by tier, then power
        console.time('sorting sets');
        // setMap.sort((a, b) => b.power - a.power);
        setMap.sort(
          (a, b) =>
            b.stats.Mobility +
            b.stats.Resilience +
            b.stats.Recovery -
            (a.stats.Mobility + a.stats.Resilience + a.stats.Recovery)
        );
        console.timeEnd('sorting sets');

        resolve(setMap);
      }
    }

    try {
      setTimeout(step, 0);
    } catch (e) {
      reportException('d2-loadout-builder', e, { combos });
      reject(e);
    }
  });
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
  return [].toString();
}
