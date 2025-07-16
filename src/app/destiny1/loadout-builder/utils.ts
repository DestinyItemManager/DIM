import { D1_StatHashes, D1BucketHashes } from 'app/search/d1-known-values';
import { isEmpty, mapValues, uniqBy } from 'app/utils/collections';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import { maxBy } from 'es-toolkit';
import { D1Item } from '../../inventory/item-types';
import { D1Store, DimStore } from '../../inventory/store-types';
import { D1StatHashes } from '../d1-manifest-types';
import { Vendor } from '../vendors/vendor.service';
import {
  ArmorSet,
  ArmorTypes,
  D1ItemWithNormalStats,
  ItemBucket,
  LockedPerkHash,
  SetType,
} from './types';

export interface ItemWithBonus {
  item: D1ItemWithNormalStats;
  bonusType: string;
}

function getBonusType(armorpiece: D1ItemWithNormalStats): string {
  if (!armorpiece.normalStats) {
    return '';
  }
  return (
    (armorpiece.normalStats[D1StatHashes.Intellect].bonus > 0 ? 'int ' : '') +
    (armorpiece.normalStats[D1StatHashes.Discipline].bonus > 0 ? 'dis ' : '') +
    (armorpiece.normalStats[D1StatHashes.Strength].bonus > 0 ? 'str' : '')
  );
}

function getBestItem(
  armor: D1ItemWithNormalStats[],
  stats: number[],
  type: string,
  scaleTypeArg: 'base' | 'scaled',
  nonExotic = false,
): ItemWithBonus {
  // for specific armor (Helmet), look at stats (int/dis), return best one.
  return {
    item: maxBy(armor, (o) => {
      if (nonExotic && o.isExotic) {
        return 0;
      }
      let bonus = 0;
      let total = 0;
      for (const stat of stats) {
        const scaleType = o.rarity === 'Rare' ? 'base' : scaleTypeArg;
        if (o.normalStats) {
          const normalStats = o.normalStats[stat];
          total += normalStats[scaleType];
          bonus = normalStats.bonus;
        }
      }
      return total + bonus;
    })!,
    bonusType: type,
  };
}

export function calcArmorStats(
  pieces: ItemWithBonus[],
  stats: ArmorSet['stats'],
  scaleTypeArg: 'base' | 'scaled',
) {
  for (const armor of pieces) {
    const int = armor.item.normalStats![D1StatHashes.Intellect];
    const dis = armor.item.normalStats![D1StatHashes.Discipline];
    const str = armor.item.normalStats![D1StatHashes.Strength];

    const scaleType = armor.item.rarity === 'Rare' ? 'base' : scaleTypeArg;

    // Mark of the Sunforged, Stormcaller Bond and Nightstalker cloak have special fixed stats
    // that do not scale correctly as the scaling is currently implemented.
    // See https://github.com/DestinyItemManager/DIM/issues/5191 for details
    if ([2820418554, 2122538507, 2300914892].includes(armor.item.hash)) {
      stats[D1StatHashes.Intellect].value += int.base;
    } else {
      stats[D1StatHashes.Intellect].value += int[scaleType];
      stats[D1StatHashes.Discipline].value += dis[scaleType];
      stats[D1StatHashes.Strength].value += str[scaleType];
    }

    switch (armor.bonusType) {
      case 'int':
        stats[D1StatHashes.Intellect].value += int.bonus;
        break;
      case 'dis':
        stats[D1StatHashes.Discipline].value += dis.bonus;
        break;
      case 'str':
        stats[D1StatHashes.Strength].value += str.bonus;
        break;
    }
  }
}

export function getBonusConfig(armor: ArmorSet['armor']): { [armorType in ArmorTypes]: string } {
  return mapValues(armor, (armorPiece) => armorPiece.bonusType);
}

export function genSetHash(armorPieces: ItemWithBonus[]) {
  let hash = '';
  for (const armorPiece of armorPieces) {
    hash += armorPiece.item.id;
  }
  return hash;
}

export function getBestArmor(
  bucket: ItemBucket,
  vendorBucket: ItemBucket,
  locked: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null },
  excluded: D1Item[],
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash },
  scaleTypeArg: 'base' | 'scaled',
  includeVendors = false,
  fullMode = false,
) {
  const statHashes = [
    { stats: [D1StatHashes.Intellect, D1StatHashes.Discipline], type: 'intdis' },
    { stats: [D1StatHashes.Intellect, D1StatHashes.Strength], type: 'intstr' },
    { stats: [D1StatHashes.Discipline, D1StatHashes.Strength], type: 'disstr' },
    { stats: [D1StatHashes.Intellect], type: 'int' },
    { stats: [D1StatHashes.Discipline], type: 'dis' },
    { stats: [D1StatHashes.Strength], type: 'str' },
  ];
  const armor: Partial<Record<ArmorTypes, ItemWithBonus[]>> = {};
  let best: { item: D1ItemWithNormalStats; bonusType: string }[] = [];
  let curbest;
  let bestCombs: { item: D1ItemWithNormalStats; bonusType: string }[];

  const excludedIndices = new Set(excluded.map((i) => i.index));

  for (const armortypestr in bucket) {
    const armortype = parseInt(armortypestr, 10) as ArmorTypes;
    const combined = includeVendors
      ? bucket[armortype].concat(vendorBucket[armortype])
      : bucket[armortype];
    const lockedItem = locked[armortype];
    if (lockedItem) {
      best = [{ item: lockedItem, bonusType: getBonusType(lockedItem) }];
    } else {
      best = [];

      let hasPerks: (item: D1Item) => boolean = (_i) => true;

      if (!isEmpty(lockedPerks[armortype])) {
        const lockedPerkKeys = Object.keys(lockedPerks[armortype]).map((k) => parseInt(k, 10));
        const andPerkHashes = lockedPerkKeys
          .filter((perkHash) => lockedPerks[armortype][perkHash].lockType === 'and')
          .map(Number);
        const orPerkHashes = lockedPerkKeys
          .filter((perkHash) => lockedPerks[armortype][perkHash].lockType === 'or')
          .map(Number);

        hasPerks = (item) => {
          if (!orPerkHashes.length && !andPerkHashes.length) {
            return true;
          }
          function matchNode(perkHash: number) {
            return item.talentGrid?.nodes.some((n) => n.hash === perkHash);
          }
          return Boolean(
            (orPerkHashes.length && orPerkHashes.some(matchNode)) ||
              (andPerkHashes.length && andPerkHashes.every(matchNode)),
          );
        };
      }

      // Filter out excluded and non-wanted perks
      const filtered = combined.filter(
        (item) => !excludedIndices.has(item.index) && hasPerks(item), // Not excluded and has the correct locked perks
      );

      for (const [index, hash] of statHashes.entries()) {
        if (!fullMode && index > 2) {
          continue;
        }

        curbest = getBestItem(filtered, hash.stats, hash.type, scaleTypeArg);
        best.push(curbest);
        // add the best -> if best is exotic -> get best legendary
        if (curbest.item.isExotic && armortype !== BucketHashes.ClassArmor) {
          best.push(getBestItem(filtered, hash.stats, hash.type, scaleTypeArg, true));
        }
      }
    }

    bestCombs = [];
    for (const obj of uniqBy(best, (o) => o.item.index)) {
      obj.bonusType = getBonusType(obj.item);
      if (obj.bonusType === '') {
        bestCombs.push({ item: obj.item, bonusType: '' });
      }
      if (obj.bonusType.includes('int')) {
        bestCombs.push({ item: obj.item, bonusType: 'int' });
      }
      if (obj.bonusType.includes('dis')) {
        bestCombs.push({ item: obj.item, bonusType: 'dis' });
      }
      if (obj.bonusType.includes('str')) {
        bestCombs.push({ item: obj.item, bonusType: 'str' });
      }
    }
    armor[armortype] = bestCombs;
  }
  return armor;
}

export function getActiveHighestSets(
  setMap: { [setHash: number]: SetType },
  activeSets: string,
): SetType[] {
  let count = 0;
  const topSets: SetType[] = [];
  for (const setType of Object.values(setMap)) {
    if (count >= 10) {
      continue;
    }

    if (setType.tiers[activeSets]) {
      topSets.push(setType);
      count += 1;
    }
  }
  return topSets;
}

export function mergeBuckets<T extends any[]>(
  bucket1: { [armorType in ArmorTypes]: T },
  bucket2: { [armorType in ArmorTypes]: T },
) {
  const merged: Partial<{ [armorType in ArmorTypes]: T }> = {};
  for (const [type, bucket] of Object.entries(bucket1)) {
    merged[parseInt(type, 10) as ArmorTypes] = bucket.concat(
      bucket2[parseInt(type, 10) as ArmorTypes],
    ) as T;
  }
  return merged as { [armorType in ArmorTypes]: T };
}

export function loadVendorsBucket(
  currentStore: DimStore,
  vendors?: {
    [vendorHash: number]: Vendor;
  },
): ItemBucket {
  if (!vendors) {
    return {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
      [D1BucketHashes.Artifact]: [],
      [BucketHashes.Ghost]: [],
    };
  }
  return Object.values(vendors)
    .map((vendor) =>
      getBuckets(
        vendor.allItems
          .filter(
            (i) =>
              i.item.stats &&
              i.item.primaryStat?.statHash === D1_StatHashes.Defense &&
              itemCanBeEquippedBy(i.item, currentStore),
          )
          .map((i) => i.item),
      ),
    )
    .reduce(mergeBuckets);
}

export function loadBucket(currentStore: DimStore, stores: D1Store[]): ItemBucket {
  return stores
    .map((store) =>
      getBuckets(
        store.items.filter(
          (i) =>
            i.stats &&
            i.primaryStat?.statHash === D1_StatHashes.Defense &&
            itemCanBeEquippedBy(i, currentStore),
        ),
      ),
    )
    .reduce(mergeBuckets);
}

function getBuckets(items: D1Item[]): ItemBucket {
  return {
    [BucketHashes.Helmet]: items
      .filter((item) => item.bucket.hash === BucketHashes.Helmet)
      .map(normalizeStats),
    [BucketHashes.Gauntlets]: items
      .filter((item) => item.bucket.hash === BucketHashes.Gauntlets)
      .map(normalizeStats),
    [BucketHashes.ChestArmor]: items
      .filter((item) => item.bucket.hash === BucketHashes.ChestArmor)
      .map(normalizeStats),
    [BucketHashes.LegArmor]: items
      .filter((item) => item.bucket.hash === BucketHashes.LegArmor)
      .map(normalizeStats),
    [BucketHashes.ClassArmor]: items
      .filter((item) => item.bucket.hash === BucketHashes.ClassArmor)
      .map(normalizeStats),
    [D1BucketHashes.Artifact]: items
      .filter((item) => item.bucket.hash === D1BucketHashes.Artifact)
      .map(normalizeStats),
    [BucketHashes.Ghost]: items
      .filter((item) => item.bucket.hash === BucketHashes.Ghost)
      .map(normalizeStats),
  };
}

function normalizeStats(item: D1ItemWithNormalStats) {
  item.normalStats = {};
  if (item.stats) {
    for (const stat of item.stats) {
      item.normalStats[stat.statHash] = {
        statHash: stat.statHash,
        base: stat.base,
        scaled: stat.scaled ? stat.scaled.min : 0,
        bonus: stat.bonus,
        split: stat.split || 0,
        qualityPercentage: stat.qualityPercentage ? stat.qualityPercentage.min : 0,
      };
    }
  }
  return item;
}
