import { D1BucketHashes } from 'app/search/d1-known-values';
import { filterMap } from 'app/utils/collections';
import { HashLookup, StringLookup } from 'app/utils/util-types';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import type {
  D1BucketCategory,
  DimBucketType,
  InventoryBucket,
  InventoryBuckets,
} from '../inventory/inventory-buckets';
import { D1Categories } from './d1-bucket-categories';
import type { D1ManifestDefinitions } from './d1-definitions';

// A mapping from the bucket hash to DIM item types
const bucketToTypeRaw = {
  [BucketHashes.ChestArmor]: 'Chest',
  [BucketHashes.LegArmor]: 'Leg',
  [BucketHashes.LostItems]: 'LostItems',
  [BucketHashes.Ships]: 'Ship',
  [D1BucketHashes.Missions]: 'Missions',
  [D1BucketHashes.Artifact]: 'Artifact',
  [BucketHashes.PowerWeapons]: 'Heavy',
  [BucketHashes.SpecialOrders]: 'SpecialOrders',
  [BucketHashes.Consumables]: 'Consumable',
  [BucketHashes.KineticWeapons]: 'Primary',
  [BucketHashes.ClassArmor]: 'ClassItem',
  [D1BucketHashes.RecordBook]: 'RecordBook',
  [D1BucketHashes.RecordBookLegacy]: 'RecordBookLegacy',
  [D1BucketHashes.Quests]: 'Quests',
  [BucketHashes.Vehicle]: 'Vehicle',
  [D1BucketHashes.Bounties]: 'Bounties',
  [BucketHashes.EnergyWeapons]: 'Special',
  [D1BucketHashes.Shader]: 'Shader',
  [BucketHashes.Modifications]: 'Ornaments',
  [BucketHashes.Emotes_Equippable]: 'Emote',
  [BucketHashes.Messages]: 'Messages',
  [BucketHashes.Subclass]: 'Class',
  [BucketHashes.Helmet]: 'Helmet',
  [BucketHashes.Gauntlets]: 'Gauntlets',
  [D1BucketHashes.Horn]: 'Horn',
  [BucketHashes.Materials]: 'Material',
  [BucketHashes.Ghost]: 'Ghost',
  [BucketHashes.Emblems]: 'Emblem',
} as const;

export type D1BucketTypes = (typeof bucketToTypeRaw)[keyof typeof bucketToTypeRaw];

// A mapping from the bucket hash to DIM item types
const bucketToType: {
  [hash: number]: DimBucketType | undefined;
} = bucketToTypeRaw;

export const vaultTypes: HashLookup<string> = {
  3003523923: 'Armor',
  4046403665: 'Weapons',
  138197802: 'General',
};

const sortToVault: StringLookup<number> = {
  Armor: 3003523923,
  Weapons: 4046403665,
  General: 138197802,
};

const bucketHashToSort: { [bucketHash: number]: D1BucketCategory } = {};
for (const [category, bucketHashes] of Object.entries(D1Categories)) {
  for (const bucketHash of bucketHashes) {
    bucketHashToSort[bucketHash] = category as D1BucketCategory;
  }
}

export function getBuckets(defs: D1ManifestDefinitions) {
  const buckets: InventoryBuckets = {
    byHash: {},
    byCategory: {},
    unknown: {
      description: 'Unknown items. DIM needs a manifest update.',
      name: 'Unknown',
      hash: -1,
      // default to false. an equipped item existing, will override this in inv display
      equippable: false,
      hasTransferDestination: false,
      category: BucketCategory.Item,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      type: 'Unknown',
      accountWide: false,
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort!] = [this.unknown];
    },
  };
  for (const def of Object.values(defs.InventoryBucket.getAll())) {
    if (def.enabled) {
      const type = bucketToType[def.hash];
      const sort = bucketHashToSort[def.hash] ?? vaultTypes[def.hash];
      const bucket: InventoryBucket = {
        description: def.bucketDescription,
        name: def.bucketName,
        hash: def.hash,
        equippable: def.category === BucketCategory.Equippable,
        hasTransferDestination: def.hasTransferDestination,
        capacity: def.itemCount,
        accountWide: false,
        category: BucketCategory.Item,
        type,
        sort,
      };
      if (sort) {
        // Add an easy helper property like "inPostmaster"
        bucket[`in${sort}`] = true;
      }
      buckets.byHash[bucket.hash] = bucket;
    }
  }
  for (const bucket of Object.values(buckets.byHash)) {
    if (bucket.sort && sortToVault[bucket.sort] && sortToVault[bucket.sort] !== bucket.hash) {
      bucket.vaultBucket = buckets.byHash[sortToVault[bucket.sort]!];
    }
  }
  for (const [category, bucketHashes] of Object.entries(D1Categories)) {
    buckets.byCategory[category] = filterMap(
      bucketHashes,
      (bucketHash) => buckets.byHash[bucketHash],
    );
  }
  return buckets;
}
