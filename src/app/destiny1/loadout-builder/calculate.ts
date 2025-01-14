import { characterStatFromStatDef } from 'app/inventory/store/character-utils';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { sumBy } from 'app/utils/collections';
import { infoLog } from 'app/utils/log';
import { delay } from 'app/utils/promises';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import { D1Item } from '../../inventory/item-types';
import { D1ManifestDefinitions } from '../d1-definitions';
import {
  ArmorSet,
  ArmorTypes,
  D1ItemWithNormalStats,
  ItemBucket,
  LockedPerkHash,
  SetType,
} from './types';
import { calcArmorStats, genSetHash, getBestArmor, getBonusConfig } from './utils';

const TAG = 'loadout optimizer';

export async function getSetBucketsStep(
  defs: D1ManifestDefinitions,
  activeGuardianBucket: ItemBucket,
  vendorBucket: ItemBucket,
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null },
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash },
  excludeditems: D1Item[],
  scaleType: 'base' | 'scaled',
  includeVendors: boolean,
  fullMode: boolean,
  cancelToken: { cancelled: boolean },
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
    fullMode,
  );
  const helms: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.Helmet] || [];
  const gauntlets: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.Gauntlets] || [];
  const chests: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.ChestArmor] || [];
  const legs: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.LegArmor] || [];
  const classItems: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.ClassArmor] || [];
  const ghosts: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[BucketHashes.Ghost] || [];
  const artifacts: {
    item: D1Item;
    bonusType: string;
  }[] = bestArmor[D1BucketHashes.Artifact] || [];
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
  const intellect = characterStatFromStatDef(defs.Stat.get(StatHashes.Intellect), 0);
  const strength = characterStatFromStatDef(defs.Stat.get(StatHashes.Strength), 0);
  const discipline = characterStatFromStatDef(defs.Stat.get(StatHashes.Discipline), 0);

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
                      [BucketHashes.Helmet]: helm,
                      [BucketHashes.Gauntlets]: gauntlet,
                      [BucketHashes.ChestArmor]: chest,
                      [BucketHashes.LegArmor]: leg,
                      [BucketHashes.ClassArmor]: classItem,
                      [D1BucketHashes.Artifact]: artifact,
                      [BucketHashes.Ghost]: ghost,
                    },
                    stats: {
                      [StatHashes.Intellect]: { ...intellect },
                      [StatHashes.Discipline]: { ...discipline },
                      [StatHashes.Strength]: { ...strength },
                    },
                    setHash: '',
                    includesVendorItems: false,
                  };

                  const pieces = Object.values(set.armor);
                  set.setHash = genSetHash(pieces);
                  calcArmorStats(pieces, set.stats, scaleType);
                  const tiersString = `${tierValue(set.stats[StatHashes.Intellect].value)}/${tierValue(
                    set.stats[StatHashes.Discipline].value,
                  )}/${tierValue(set.stats[StatHashes.Strength].value)}`;

                  tiersSet.add(tiersString);

                  // Build a map of all sets but only keep one copy of armor
                  // so we reduce memory usage
                  if (setMap[set.setHash]) {
                    if (setMap[set.setHash].tiers[tiersString]) {
                      setMap[set.setHash].tiers[tiersString].configs.push(
                        getBonusConfig(set.armor),
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
                  infoLog(TAG, 'cancelled processing');
                  return;
                }
                if (processedCount % 50000 === 0) {
                  infoLog(
                    'loadout optimizer',
                    processedCount,
                    'combinations processed, still going...',
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
    sumBy(tierString.split('/'), (num) => parseInt(num, 10)),
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
    infoLog(TAG, 'cancelled processing');
    return;
  }

  // Finish progress
  infoLog(TAG, 'processed', combos, 'combinations.');

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
