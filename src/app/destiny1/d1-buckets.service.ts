import * as _ from 'lodash';
import { getDefinitions } from './d1-definitions.service';
import { InventoryBuckets, InventoryBucket } from '../inventory/inventory-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';

export const D1Categories = {
  Postmaster: ['LostItems', 'SpecialOrders', 'Messages'],
  Weapons: ['Class', 'Primary', 'Special', 'Heavy'],
  Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
  General: [
    'Artifact',
    'Ghost',
    'Consumable',
    'Material',
    'Ornaments',
    'Emblem',
    'Shader',
    'Emote',
    'Ship',
    'Vehicle',
    'Horn'
  ],
  Progress: ['Bounties', 'Quests', 'Missions']
};

// A mapping from the bucket names to DIM item types
// Some buckets like vault and currencies have been ommitted
const bucketToType = {
  BUCKET_CHEST: 'Chest',
  BUCKET_LEGS: 'Leg',
  BUCKET_RECOVERY: 'LostItems',
  BUCKET_SHIP: 'Ship',
  BUCKET_MISSION: 'Missions',
  BUCKET_ARTIFACT: 'Artifact',
  BUCKET_HEAVY_WEAPON: 'Heavy',
  BUCKET_COMMERCIALIZATION: 'SpecialOrders',
  BUCKET_CONSUMABLES: 'Consumable',
  BUCKET_PRIMARY_WEAPON: 'Primary',
  BUCKET_CLASS_ITEMS: 'ClassItem',
  BUCKET_BOOK_LARGE: 'RecordBook',
  BUCKET_BOOK_SMALL: 'RecordBookLegacy',
  BUCKET_QUESTS: 'Quests',
  BUCKET_VEHICLE: 'Vehicle',
  BUCKET_BOUNTIES: 'Bounties',
  BUCKET_SPECIAL_WEAPON: 'Special',
  BUCKET_SHADER: 'Shader',
  BUCKET_MODS: 'Ornaments',
  BUCKET_EMOTES: 'Emote',
  BUCKET_MAIL: 'Messages',
  BUCKET_BUILD: 'Class',
  BUCKET_HEAD: 'Helmet',
  BUCKET_ARMS: 'Gauntlets',
  BUCKET_HORN: 'Horn',
  BUCKET_MATERIALS: 'Material',
  BUCKET_GHOST: 'Ghost',
  BUCKET_EMBLEM: 'Emblem'
};

const vaultTypes = {
  BUCKET_VAULT_ARMOR: 'Armor',
  BUCKET_VAULT_WEAPONS: 'Weapons',
  BUCKET_VAULT_ITEMS: 'General'
};
const sortToVault = {
  Armor: 'BUCKET_VAULT_ARMOR',
  Weapons: 'BUCKET_VAULT_WEAPONS',
  General: 'BUCKET_VAULT_ITEMS'
};

const typeToSort = {};
_.each(D1Categories, (types, category) => {
  types.forEach((type) => {
    typeToSort[type] = category;
  });
});

export const getBuckets = _.once(async () => {
  const defs = await getDefinitions();
  const buckets: InventoryBuckets = {
    byHash: {},
    byId: {},
    byType: {},
    byCategory: {},
    unknown: {
      id: 'BUCKET_UNKNOWN',
      description: 'Unknown items. DIM needs a manifest update.',
      name: 'Unknown',
      hash: -1,
      hasTransferDestination: false,
      category: BucketCategory.Item,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      type: 'Unknown',
      accountWide: false
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort] = [this.unknown];
      this.byId[this.unknown.id] = this.unknown;
      this.byType[this.unknown.type] = this.unknown;
    }
  };
  _.each(defs.InventoryBucket, (def: any) => {
    if (def.enabled) {
      const id = def.bucketIdentifier;
      const type = bucketToType[def.bucketIdentifier];
      let sort: string | undefined;
      if (type) {
        sort = typeToSort[type];
      } else if (vaultTypes[id]) {
        sort = vaultTypes[id];
      }
      const bucket: InventoryBucket = {
        id,
        description: def.bucketDescription,
        name: def.bucketName,
        hash: def.hash,
        hasTransferDestination: def.hasTransferDestination,
        capacity: def.itemCount,
        accountWide: false,
        category: BucketCategory.Item,
        type: bucketToType[def.bucketIdentifier],
        sort
      };
      if (bucket.type) {
        buckets.byType[bucket.type] = bucket;
      }
      if (sort) {
        // Add an easy helper property like "inPostmaster"
        bucket[`in${sort}`] = true;
      }
      buckets.byHash[bucket.hash] = bucket;
      buckets.byId[bucket.id] = bucket;
    }
  });
  _.each(buckets.byHash, (bucket: InventoryBucket) => {
    if (bucket.sort && sortToVault[bucket.sort]) {
      bucket.vaultBucket = buckets.byId[sortToVault[bucket.sort]];
    }
  });
  _.each(D1Categories, (types, category) => {
    buckets.byCategory[category] = _.compact(
      types.map((type) => {
        return buckets.byType[type];
      })
    );
  });
  return buckets;
});
