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
  const helms = filteredItems[LockableBuckets.helmet] || [];
  const gaunts = filteredItems[LockableBuckets.gauntlets] || [];
  const chests = filteredItems[LockableBuckets.chest] || [];
  const legs = filteredItems[LockableBuckets.leg] || [];
  const classitems = filteredItems[LockableBuckets.classitem] || [];
  const setMap: ArmorSet[] = [];
  const combos = helms.length * gaunts.length * chests.length * legs.length * classitems.length;

  if (combos === 0) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    function step(h = 0, g = 0, c = 0, l = 0, ci = 0, processedCount = 0) {
      for (; h < helms.length; ++h) {
        for (; g < gaunts.length; ++g) {
          for (; c < chests.length; ++c) {
            for (; l < legs.length; ++l) {
              for (; ci < classitems.length; ++ci) {
                const validSet =
                  Number(helms[h].isExotic) +
                    Number(gaunts[g].isExotic) +
                    Number(chests[c].isExotic) +
                    Number(legs[l].isExotic) <
                  2;

                if (validSet) {
                  const stats: { [statType in StatTypes]: number } = {
                    Mobility: 0,
                    Resilience: 0,
                    Recovery: 0
                  };

                  const set: ArmorSet = {
                    id: processedCount,
                    armor: [helms[h], gaunts[g], chests[c], legs[l], classitems[ci]],
                    power:
                      helms[h].basePower +
                      gaunts[g].basePower +
                      chests[c].basePower +
                      legs[l].basePower +
                      classitems[ci].basePower,
                    // TODO: iterate over perk bonus options and add all tier options
                    stats
                  };

                  for (const armor of set.armor) {
                    const stat = armor.stats;
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
                }

                processedCount++;
                if (cancelToken.cancelled) {
                  console.log('cancelled processing');
                  return;
                }
                if (processedCount % 10000 === 0) {
                  onProgress(Math.floor((processedCount / combos) * 100));
                  return setTimeout(() => {
                    step(h, g, c, l, ci, processedCount);
                  }, 0);
                }
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
        return;
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
      setMap.sort((a, b) => b.power - a.power);
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

    try {
      setTimeout(step, 0);
    } catch (e) {
      reportException('d2-loadout-builder', e, { combos });
      reject(e);
    }
  });
}
