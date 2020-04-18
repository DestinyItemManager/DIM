import {
  D1ItemWithNormalStats,
  ArmorTypes,
  ItemBucket,
  SetType,
  ArmorSet,
  LockedPerkHash
} from './types';

import { D1Item } from '../../inventory/item-types';

import _ from 'lodash';
import { DimStore, D1Store } from '../../inventory/store-types';
import { Vendor } from '../vendors/vendor.service';

function getBonusType(armorpiece: D1ItemWithNormalStats): string {
  if (!armorpiece.normalStats) {
    return '';
  }
  return (
    (armorpiece.normalStats[144602215].bonus > 0 ? 'int ' : '') +
    (armorpiece.normalStats[1735777505].bonus > 0 ? 'dis ' : '') +
    (armorpiece.normalStats[4244567218].bonus > 0 ? 'str' : '')
  );
}

function getBestItem(
  armor: D1ItemWithNormalStats[],
  stats: number[],
  type: string,
  scaleTypeArg: 'base' | 'scaled',
  nonExotic = false
) {
  // for specific armor (Helmet), look at stats (int/dis), return best one.
  return {
    item: _.maxBy(armor, (o) => {
      if (nonExotic && o.isExotic) {
        return 0;
      }
      let bonus = 0;
      let total = 0;
      for (const stat of stats) {
        const scaleType = o.tier === 'Rare' ? 'base' : scaleTypeArg;
        if (o.normalStats) {
          const normalStats = o.normalStats[stat];
          total += normalStats[scaleType];
          bonus = normalStats.bonus;
        }
      }
      return total + bonus;
    })!,
    bonusType: type
  };
}

export function calcArmorStats(
  pieces: {
    item: D1ItemWithNormalStats;
    bonusType: string;
  }[],
  stats: ArmorSet['stats'],
  scaleTypeArg: 'base' | 'scaled'
) {
  for (const armor of pieces) {
    const int = armor.item.normalStats![144602215];
    const dis = armor.item.normalStats![1735777505];
    const str = armor.item.normalStats![4244567218];

    const scaleType = armor.item.tier === 'Rare' ? 'base' : scaleTypeArg;

    stats[144602215].value += int[scaleType];
    stats[1735777505].value += dis[scaleType];
    stats[4244567218].value += str[scaleType];

    switch (armor.bonusType) {
      case 'int':
        stats[144602215].value += int.bonus;
        break;
      case 'dis':
        stats[1735777505].value += dis.bonus;
        break;
      case 'str':
        stats[4244567218].value += str.bonus;
        break;
    }
  }
}

export function getBonusConfig(armor: ArmorSet['armor']): { [armorType in ArmorTypes]: string } {
  return {
    Helmet: armor.Helmet.bonusType,
    Gauntlets: armor.Gauntlets.bonusType,
    Chest: armor.Chest.bonusType,
    Leg: armor.Leg.bonusType,
    ClassItem: armor.ClassItem.bonusType,
    Artifact: armor.Artifact.bonusType,
    Ghost: armor.Ghost.bonusType
  };
}

export function genSetHash(armorPieces) {
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
  fullMode = false
) {
  const statHashes = [
    { stats: [144602215, 1735777505], type: 'intdis' },
    { stats: [144602215, 4244567218], type: 'intstr' },
    { stats: [1735777505, 4244567218], type: 'disstr' },
    { stats: [144602215], type: 'int' },
    { stats: [1735777505], type: 'dis' },
    { stats: [4244567218], type: 'str' }
  ];
  const armor = {};
  let best: { item: D1ItemWithNormalStats; bonusType: string }[] = [];
  let curbest;
  let bestCombs;
  let armortype: ArmorTypes;

  const excludedIndices = new Set(excluded.map((i) => i.index));

  for (armortype in bucket) {
    const combined = includeVendors
      ? bucket[armortype].concat(vendorBucket[armortype])
      : bucket[armortype];
    const lockedItem = locked[armortype];
    if (lockedItem) {
      best = [{ item: lockedItem, bonusType: getBonusType(lockedItem) }];
    } else {
      best = [];

      let hasPerks: (item: D1Item) => boolean = () => true;

      if (!_.isEmpty(lockedPerks[armortype])) {
        const lockedPerkKeys = Object.keys(lockedPerks[armortype]);
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
          function matchNode(perkHash) {
            return item.talentGrid?.nodes.some((n) => n.hash === perkHash);
          }
          return Boolean(
            (orPerkHashes.length && orPerkHashes.some(matchNode)) ||
              (andPerkHashes.length && andPerkHashes.every(matchNode))
          );
        };
      }

      // Filter out excluded and non-wanted perks
      const filtered = combined.filter(
        (item) => !excludedIndices.has(item.index) && hasPerks(item) // Not excluded and has the correct locked perks
      );

      statHashes.forEach((hash, index) => {
        if (!fullMode && index > 2) {
          return;
        }

        curbest = getBestItem(filtered, hash.stats, hash.type, scaleTypeArg);
        best.push(curbest);
        // add the best -> if best is exotic -> get best legendary
        if (curbest.item.isExotic && armortype !== 'ClassItem') {
          best.push(getBestItem(filtered, hash.stats, hash.type, scaleTypeArg, true));
        }
      });
    }

    bestCombs = [];
    _.uniqBy(best, (o) => o.item.index).forEach((obj) => {
      obj.bonusType = getBonusType(obj.item);
      if (obj.bonusType === '') {
        bestCombs.push({ item: obj.item, bonusType: '' });
      }
      if (obj.bonusType.indexOf('int') > -1) {
        bestCombs.push({ item: obj.item, bonusType: 'int' });
      }
      if (obj.bonusType.indexOf('dis') > -1) {
        bestCombs.push({ item: obj.item, bonusType: 'dis' });
      }
      if (obj.bonusType.indexOf('str') > -1) {
        bestCombs.push({ item: obj.item, bonusType: 'str' });
      }
    });
    armor[armortype] = bestCombs;
  }
  return armor;
}

export function getActiveHighestSets(
  setMap: { [setHash: number]: SetType },
  activeSets: string
): SetType[] {
  let count = 0;
  const topSets: SetType[] = [];
  Object.values(setMap).forEach((setType) => {
    if (count >= 10) {
      return;
    }

    if (setType.tiers[activeSets]) {
      topSets.push(setType);
      count += 1;
    }
  });
  return topSets;
}

export function mergeBuckets<T>(
  bucket1: { [armorType in ArmorTypes]: T },
  bucket2: { [armorType in ArmorTypes]: T }
): { [armorType in ArmorTypes]: T } {
  const merged = {};
  Object.keys(bucket1).forEach((type) => {
    merged[type] = bucket1[type].concat(bucket2[type]);
  });
  return merged as { [armorType in ArmorTypes]: T };
}

export function getActiveBuckets<T>(
  bucket1: { [armorType in ArmorTypes]: T },
  bucket2: { [armorType in ArmorTypes]: T },
  merge: boolean
): { [armorType in ArmorTypes]: T } {
  // Merge both buckets or return bucket1 if merge is false
  return merge ? mergeBuckets(bucket1, bucket2) : bucket1;
}

export function loadVendorsBucket(
  currentStore: DimStore,
  vendors?: {
    [vendorHash: number]: Vendor;
  }
): ItemBucket {
  if (!vendors) {
    return {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Artifact: [],
      Ghost: []
    };
  }
  return _.map(vendors, (vendor) =>
    getBuckets(
      vendor.allItems
        .filter(
          (i) =>
            i.item.stats &&
            i.item.primStat?.statHash === 3897883278 &&
            i.item.canBeEquippedBy(currentStore)
        )
        .map((i) => i.item)
    )
  ).reduce(mergeBuckets);
}

export function loadBucket(currentStore: DimStore, stores: D1Store[]): ItemBucket {
  return stores
    .map((store) =>
      getBuckets(
        store.items.filter(
          (i) => i.stats && i.primStat?.statHash === 3897883278 && i.canBeEquippedBy(currentStore)
        )
      )
    )
    .reduce(mergeBuckets);
}

function getBuckets(items: D1Item[]): ItemBucket {
  return {
    Helmet: items.filter((item) => item.type === 'Helmet').map(normalizeStats),
    Gauntlets: items.filter((item) => item.type === 'Gauntlets').map(normalizeStats),
    Chest: items.filter((item) => item.type === 'Chest').map(normalizeStats),
    Leg: items.filter((item) => item.type === 'Leg').map(normalizeStats),
    ClassItem: items.filter((item) => item.type === 'ClassItem').map(normalizeStats),
    Artifact: items.filter((item) => item.type === 'Artifact').map(normalizeStats),
    Ghost: items.filter((item) => item.type === 'Ghost').map(normalizeStats)
  };
}

function normalizeStats(item: D1ItemWithNormalStats) {
  item.normalStats = {};
  for (const stat of item.stats!) {
    item.normalStats[stat.statHash] = {
      statHash: stat.statHash,
      base: stat.base,
      scaled: stat.scaled ? stat.scaled.min : 0,
      bonus: stat.bonus,
      split: stat.split || 0,
      qualityPercentage: stat.qualityPercentage ? stat.qualityPercentage.min : 0
    };
  }
  return item;
}
