import { infoLog } from 'app/utils/log';
import { delay } from 'app/utils/util';
import disciplineIcon from 'images/discipline.png';
import intellectIcon from 'images/intellect.png';
import strengthIcon from 'images/strength.png';
import _ from 'lodash';
import { D1Item } from '../../inventory/item-types';
import {
  ArmorSet,
  ArmorTypes,
  D1ItemWithNormalStats,
  ItemBucket,
  LockedPerkHash,
  SetType,
} from './types';
import { calcArmorStats, genSetHash, getBestArmor, getBonusConfig } from './utils';

export async function getSetBucketsStep(
  activeGuardianBucket: ItemBucket,
  vendorBucket: ItemBucket,
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null },
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash },
  excludeditems: D1Item[],
  scaleType: 'base' | 'scaled',
  includeVendors: boolean,
  fullMode: boolean,
  cancelToken: { cancelled: boolean }
): Promise<
  | {
      allSetTiers: string[];
      activesets: string;
      highestsets: { [setHash: number]: SetType };
    }
  | undefined
> {
  const bestArmor = getBestArmor(
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
  const setMap: { [setHash: string]: SetType } = {};
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
      allSetTiers: [],
      activesets: '',
      highestsets: {},
    });
  }

  let processedCount = 0;

  for (const helm of helms) {
    for (const gauntlet of gauntlets) {
      for (const chest of chests) {
        for (const leg of legs) {
          for (const classItem of classItems) {
            for (const ghost of ghosts) {
              for (const artifact of artifacts) {
                const validSet =
                  Number(helm.item.isExotic) +
                    Number(gauntlet.item.isExotic) +
                    Number(chest.item.isExotic) +
                    Number(leg.item.isExotic) <
                  2;

                if (validSet) {
                  const set: ArmorSet = {
                    armor: {
                      Helmet: helm,
                      Gauntlets: gauntlet,
                      Chest: chest,
                      Leg: leg,
                      ClassItem: classItem,
                      Artifact: artifact,
                      Ghost: ghost,
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
                  infoLog(
                    'loadout optimizer',
                    processedCount,
                    'combinations processed, still going...'
                  );
                  // Allow the event loop to do other things before we resume
                  await delay(0);
                }
              }
            }
          }
        }
      }
    }
  }

  const tiers = Object.groupBy(tiersSet.keys(), (tierString: string) =>
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

  if (cancelToken.cancelled) {
    infoLog('loadout optimizer', 'cancelled processing');
    return;
  }

  // Finish progress
  infoLog('loadout optimizer', 'processed', combos, 'combinations.');

  return {
    allSetTiers,
    activesets,
    highestsets: setMap,
  };

  // reset: lockedchanged, excludedchanged, perkschanged, hassets
}

function tierValue(value: number) {
  return Math.floor(Math.min(300, value) / 60);
}
