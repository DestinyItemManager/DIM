import { D1BucketHashes } from 'app/search/d1-known-values';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
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
  [BucketHashes.Engrams]: 'Missions', // Yes, engrams (D1) and missions (D1) have the same hash
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

/** @deprecated */
export type D1BucketTypes = typeof bucketToTypeRaw[keyof typeof bucketToTypeRaw];

// A mapping from the bucket hash to DIM item types
const bucketToType: {
  [hash: number]: DimBucketType | undefined;
} = bucketToTypeRaw;

export const vaultTypes = {
  3003523923: 'Armor',
  4046403665: 'Weapons',
  138197802: 'General',
};

const sortToVault = {
  Armor: 3003523923,
  Weapons: 4046403665,
  General: 138197802,
};

const typeToSort: { [type: string]: D1BucketCategory } = {};
_.forIn(D1Categories, (types, category: D1BucketCategory) => {
  types.forEach((type) => {
    typeToSort[type] = category;
  });
});

export function getBuckets(defs: D1ManifestDefinitions) {
  const buckets: InventoryBuckets = {
    byHash: {},
    byType: {},
    byCategory: {},
    unknown: {
      description: 'Unknown items. DIM needs a manifest update.',
      name: 'Unknown',
      hash: -1,
      hasTransferDestination: false,
      category: BucketCategory.Item,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      type: 'Unknown',
      accountWide: false,
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort] = [this.unknown];
      this.byType[this.unknown.type] = this.unknown;
    },
  };
  _.forIn(defs.InventoryBucket, (def: any) => {
    if (def.enabled) {
      const type = bucketToType[def.hash];
      let sort: D1BucketCategory | undefined;
      if (type) {
        sort = typeToSort[type];
      } else if (vaultTypes[def.hash]) {
        sort = vaultTypes[def.hash];
      }
      const bucket: InventoryBucket = {
        description: def.bucketDescription,
        name: def.bucketName,
        hash: def.hash,
        hasTransferDestination: def.hasTransferDestination,
        capacity: def.itemCount,
        accountWide: false,
        category: BucketCategory.Item,
        type: bucketToType[def.hash],
        sort,
      };
      if (bucket.type) {
        buckets.byType[bucket.type] = bucket;
      }
      if (sort) {
        // Add an easy helper property like "inPostmaster"
        bucket[`in${sort}`] = true;
      }
      buckets.byHash[bucket.hash] = bucket;
    }
  });
  _.forIn(buckets.byHash, (bucket: InventoryBucket) => {
    if (bucket.sort && sortToVault[bucket.sort]) {
      bucket.vaultBucket = buckets.byHash[sortToVault[bucket.sort]];
    }
  });
  _.forIn(D1Categories, (types, category) => {
    buckets.byCategory[category] = _.compact(types.map((type) => buckets.byType[type]));
  });
  return buckets;
}
