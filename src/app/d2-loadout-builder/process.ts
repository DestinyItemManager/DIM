import * as _ from 'underscore';
import { sum } from '../util';
import { D2Item } from '../inventory/item-types';
import { SetType, LockableBuckets, ArmorSet } from './types';
import { getSetsForTier } from './utils';

let killProcess = false;

/**
 * This safely waits for an existing process to be killed, then begins another.
 */
export default function startNewProcess(filteredItems: { [bucket: number]: D2Item[] }) {
  if (this.state.processRunning !== 0) {
    killProcess = true;
    return window.requestAnimationFrame(() => startNewProcess.call(this, filteredItems));
  }

  process.call(this, filteredItems);
}

/**
 * This processes all permutations of armor to build sets
 * TODO: This function must be called such that it has has access to `this.setState`
 *
 * @param filteredItems paired down list of items to process sets from
 */
function process(filteredItems: { [bucket: number]: D2Item[] }) {
  const pstart = performance.now();
  const helms = filteredItems[LockableBuckets.helmet] || [];
  const gaunts = filteredItems[LockableBuckets.gauntlets] || [];
  const chests = filteredItems[LockableBuckets.chest] || [];
  const legs = filteredItems[LockableBuckets.leg] || [];
  const classitems = filteredItems[LockableBuckets.classitem] || [];
  const setMap: { [setHash: number]: SetType } = {};
  const tiersSet = new Set<string>();
  const setTiers: string[] = [];
  const combos = helms.length * gaunts.length * chests.length * legs.length * classitems.length;

  if (combos === 0) {
    this.setState({ matchedSets: [], setTiers: [] });
    return;
  }

  function calcArmorStats(pieces, stats) {
    let i = pieces.length;
    while (i--) {
      if (pieces[i].stats.length) {
        stats.STAT_MOBILITY += pieces[i].stats[0].base;
        stats.STAT_RESILIENCE += pieces[i].stats[1].base;
        stats.STAT_RECOVERY += pieces[i].stats[2].base;
      }
    }
  }

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
                const set: ArmorSet = {
                  armor: [helms[h], gaunts[g], chests[c], legs[l], classitems[ci]],
                  power:
                    helms[h].basePower +
                    gaunts[g].basePower +
                    chests[c].basePower +
                    legs[l].basePower +
                    classitems[ci].basePower,
                  stats: {
                    STAT_MOBILITY: 0,
                    STAT_RESILIENCE: 0,
                    STAT_RECOVERY: 0
                  },
                  setHash:
                    helms[h].id + gaunts[g].id + chests[c].id + legs[l].id + classitems[ci].id,
                  includesVendorItems: false
                };

                calcArmorStats(set.armor, set.stats);
                const tiersString = `${set.stats.STAT_MOBILITY}/${set.stats.STAT_RESILIENCE}/${
                  set.stats.STAT_RECOVERY
                }`;

                tiersSet.add(tiersString);

                // Build a map of all sets but only keep one copy of armor
                // so we reduce memory usage
                if (setMap[set.setHash]) {
                  if (setMap[set.setHash].tiers[tiersString]) {
                    // setMap[set.setHash].tiers[tiersString].configs.push(getBonusConfig(set.armor));
                  } else {
                    setMap[set.setHash].tiers[tiersString] = {
                      stats: set.stats
                      // configs: [getBonusConfig(set.armor)]
                    };
                  }
                } else {
                  setMap[set.setHash] = { set, tiers: {} };
                  setMap[set.setHash].tiers[tiersString] = {
                    stats: set.stats
                    // configs: [getBonusConfig(set.armor)]
                  };
                }
                // set.includesVendorItems = pieces.some((armor: any) => armor.isVendorItem);
              }

              processedCount++;
              if (processedCount % 50000 === 0) {
                if (killProcess) {
                  this.setState({ processRunning: 0 });
                  killProcess = false;
                  return;
                }
                this.setState({ processRunning: Math.floor((processedCount / combos) * 100) });
                return window.requestAnimationFrame(() => {
                  step.call(this, h, g, c, l, ci, processedCount);
                });
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

    const tiers = _.each(
      _.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
        return sum(tierString.split('/'), (num) => parseInt(num, 10));
      }),
      (tier) => {
        tier.sort().reverse();
      }
    );

    const tierKeys = Object.keys(tiers);
    for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
      if (tierKeys[t]) {
        setTiers.push(`- Tier ${tierKeys[t]} -`);
        tiers[tierKeys[t]].forEach((set) => {
          setTiers.push(set);
        });
      }
    }

    this.setState({
      setTiers,
      processedSets: setMap,
      matchedSets: getSetsForTier(setMap, this.state.lockedMap, setTiers[1]),
      processRunning: 0
    });
    console.log('processed', combos, 'combinations in', performance.now() - pstart);
  }

  return step.call(this);
}
