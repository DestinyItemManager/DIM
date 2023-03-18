import { infoLog } from 'app/utils/log';
import disciplineIcon from 'images/discipline.png';
import intellectIcon from 'images/intellect.png';
import strengthIcon from 'images/strength.png';
import _ from 'lodash';
import { D1Item } from '../../inventory/item-types';
import { D1Store } from '../../inventory/store-types';
import {
  ArmorSet,
  ArmorTypes,
  D1ItemWithNormalStats,
  ItemBucket,
  LockedPerkHash,
  SetType,
} from './types';
import {
  calcArmorStats,
  genSetHash,
  getActiveHighestSets,
  getBestArmor,
  getBonusConfig,
} from './utils';

export function getSetBucketsStep(
  activeGuardian: D1Store,
  activeGuardianBucket: ItemBucket,
  vendorBucket: ItemBucket,
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null },
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash },
  excludeditems: D1Item[],
  scaleType: 'base' | 'scaled',
  includeVendors: boolean,
  fullMode: boolean,
  cancelToken: { cancelled: boolean }
): Promise<{
  activeGuardian: D1Store;
  allSetTiers: string[];
  activesets: string;
  highestsets: { [setHash: number]: SetType };
  activeHighestSets: { [setHash: number]: SetType };
  collapsedConfigs: boolean[];
}> {
  const bestArmor: any = getBestArmor(
    activeGuardianBucket,
    vendorBucket,
    lockeditems,
    excludeditems,
    lockedperks,
    scaleType,
    includeVendors,
    fullMode
  );
  const helms: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Helmet || [];
  const gauntlets: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Gauntlets || [];
  const chests: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Chest || [];
  const legs: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Leg || [];
  const classItems: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.ClassItem || [];
  const ghosts: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Ghost || [];
  const artifacts: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor.Artifact || [];
  const setMap: { [setHash: number]: SetType } = {};
  const tiersSet = new Set<string>();
  const combos =
    helms.length *
    gauntlets.length *
    chests.length *
    legs.length *
    classItems.length *
    ghosts.length *
    artifacts.length;
  if (combos === 0) {
    return Promise.resolve({
      activeGuardian,
      allSetTiers: [],
      activesets: '',
      highestsets: {},
      activeHighestSets: {},
      collapsedConfigs: [],
    });
  }

  return new Promise((resolve) => {
    function step(
      activeGuardian: D1Store,
      h: number,
      g: number,
      c: number,
      l: number,
      ci: number,
      gh: number,
      ar: number,
      processedCount: number
    ) {
      for (; h < helms.length; ++h) {
        for (; g < gauntlets.length; ++g) {
          for (; c < chests.length; ++c) {
            for (; l < legs.length; ++l) {
              for (; ci < classItems.length; ++ci) {
                for (; gh < ghosts.length; ++gh) {
                  for (; ar < artifacts.length; ++ar) {
                    const validSet =
                      Number(helms[h].item.isExotic) +
                        Number(gauntlets[g].item.isExotic) +
                        Number(chests[c].item.isExotic) +
                        Number(legs[l].item.isExotic) <
                      2;

                    if (validSet) {
                      const set: ArmorSet = {
                        armor: {
                          Helmet: helms[h],
                          Gauntlets: gauntlets[g],
                          Chest: chests[c],
                          Leg: legs[l],
                          ClassItem: classItems[ci],
                          Artifact: artifacts[ar],
                          Ghost: ghosts[gh],
                        },
                        stats: {
                          144602215: {
                            hash: 144602215,
                            value: 0,
                            name: 'Intellect',
                            description: '',
                            icon: intellectIcon,
                          },
                          1735777505: {
                            hash: 1735777505,
                            value: 0,
                            name: 'Discipline',
                            description: '',
                            icon: disciplineIcon,
                          },
                          4244567218: {
                            hash: 4244567218,
                            value: 0,
                            name: 'Strength',
                            description: '',
                            icon: strengthIcon,
                          },
                        },
                        setHash: '',
                        includesVendorItems: false,
                      };

                      const pieces = Object.values(set.armor);
                      set.setHash = genSetHash(pieces);
                      calcArmorStats(pieces, set.stats, scaleType);
                      const tiersString = `${tierValue(set.stats[144602215].value)}/${tierValue(
                        set.stats[1735777505].value
                      )}/${tierValue(set.stats[4244567218].value)}`;

                      tiersSet.add(tiersString);

                      // Build a map of all sets but only keep one copy of armor
                      // so we reduce memory usage
                      if (setMap[set.setHash]) {
                        if (setMap[set.setHash].tiers[tiersString]) {
                          setMap[set.setHash].tiers[tiersString].configs.push(
                            getBonusConfig(set.armor)
                          );
                        } else {
                          setMap[set.setHash].tiers[tiersString] = {
                            stats: set.stats,
                            configs: [getBonusConfig(set.armor)],
                          };
                        }
                      } else {
                        setMap[set.setHash] = { set, tiers: {} };
                        setMap[set.setHash].tiers[tiersString] = {
                          stats: set.stats,
                          configs: [getBonusConfig(set.armor)],
                        };
                      }

                      // no owner means this is a vendor item
                      set.includesVendorItems = pieces.some((armor) => !armor.item.owner);
                    }

                    processedCount++;
                    if (cancelToken.cancelled) {
                      infoLog('loadout optimizer', 'cancelled processing');
                      return;
                    }
                    if (processedCount % 50000 === 0) {
                      infoLog('loadout optimizer', '50,000 combinations processed, still going...');
                      setTimeout(() =>
                        step(activeGuardian, h, g, c, l, ci, gh, ar, processedCount)
                      );
                      return;
                    }
                  }
                  ar = 0;
                }
                gh = 0;
              }
              ci = 0;
            }
            l = 0;
          }
          c = 0;
        }
        g = 0;
      }

      const tiers = _.groupBy(Array.from(tiersSet.keys()), (tierString: string) =>
        _.sumBy(tierString.split('/'), (num) => parseInt(num, 10))
      );
      for (const tier of Object.values(tiers)) {
        tier.sort().reverse();
      }

      const allSetTiers: string[] = [];
      const tierKeys = Object.keys(tiers);
      for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
        if (tierKeys[t]) {
          allSetTiers.push(`- Tier ${tierKeys[t]} -`);
          for (const set of tiers[tierKeys[t]]) {
            allSetTiers.push(set);
          }
        }
      }

      let activesets = '';
      if (!allSetTiers.includes(activesets)) {
        activesets = allSetTiers[1];
      }
      const activeHighestSets = getActiveHighestSets(setMap, activesets);
      const collapsedConfigs = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];

      if (cancelToken.cancelled) {
        infoLog('loadout optimizer', 'cancelled processing');
        return;
      }

      // Finish progress
      infoLog('loadout optimizer', 'processed', combos, 'combinations.');

      resolve({
        activeGuardian,
        allSetTiers,
        activesets,
        activeHighestSets,
        collapsedConfigs,
        highestsets: setMap,
      });
    }
    setTimeout(() => step(activeGuardian, 0, 0, 0, 0, 0, 0, 0, 0));
  });

  // reset: lockedchanged, excludedchanged, perkschanged, hassets
}

function tierValue(value: number) {
  return Math.floor(Math.min(300, value) / 60);
}
