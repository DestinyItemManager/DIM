import _ from 'lodash';
import { D1ManifestDefinitions } from './d1-definitions';
import { InventoryBuckets, InventoryBucket } from '../inventory/inventory-buckets';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { D1Categories } from './d1-bucket-categories';

// A mapping from the bucket hash to DIM item types
const bucketToType = {
  14239492: 'Chest',
  20886954: 'Leg',
  215593132: 'LostItems',
  284967655: 'Ship',
  375726501: 'Missions',
  434908299: 'Artifact',
  953998645: 'Heavy',
  1367666825: 'SpecialOrders',
  1469714392: 'Consumable',
  1498876634: 'Primary',
  1585787867: 'ClassItem',
  2987185182: 'RecordBook',
  549485690: 'RecordBookLegacy',
  1801258597: 'Quests',
  2025709351: 'Vehicle',
  2197472680: 'Bounties',
  2465295065: 'Special',
  2973005342: 'Shader',
  3313201758: 'Ornaments',
  3054419239: 'Emote',
  3161908920: 'Messages',
  3284755031: 'Class',
  3448274439: 'Helmet',
  3551918588: 'Gauntlets',
  3796357825: 'Horn',
  3865314626: 'Material',
  4023194814: 'Ghost',
  4274335291: 'Emblem',
};

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

const typeToSort = {};
_.forIn(D1Categories, (types, category) => {
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
      let sort: string | undefined;
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
