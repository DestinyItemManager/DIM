import { VENDORS } from 'app/search/d2-known-values';
import { BucketCategory, DestinyInventoryBucketDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import type {
  D2BucketCategory,
  DimBucketType,
  InventoryBucket,
  InventoryBuckets,
} from '../inventory-stores/inventory-buckets';
import { D2Categories } from './d2-bucket-categories';
import { D2ManifestDefinitions } from './d2-definitions';

// A mapping from the bucket hash to DIM item types
const bucketToTypeRaw = {
  2465295065: 'Energy',
  2689798304: 'UpgradePoint',
  2689798305: 'StrangeCoin',
  2689798308: 'Glimmer',
  2689798309: 'Legendary Shards',
  2689798310: 'Silver',
  2689798311: 'Bright Dust',
  3161908920: 'Messages',
  3284755031: 'Class',
  3313201758: 'Modifications',
  3448274439: 'Helmet',
  3551918588: 'Gauntlets',
  3865314626: 'Materials',
  4023194814: 'Ghost',
  4274335291: 'Emblems',
  4292445962: 'ClanBanners',
  14239492: 'Chest',
  20886954: 'Leg',
  215593132: 'LostItems',
  284967655: 'Ships',
  375726501: 'Engrams',
  953998645: 'Power',
  1269569095: 'Auras',
  1367666825: 'SpecialOrders',
  1498876634: 'KineticSlot',
  1585787867: 'ClassItem',
  2025709351: 'Vehicle',
  1469714392: 'Consumables',
  138197802: 'General',
  1107761855: 'Emotes',
  1345459588: 'Pursuits',
  1506418338: 'SeasonalArtifacts',
  3683254069: 'Finishers',
} as const;

export type D2BucketTypes = typeof bucketToTypeRaw[keyof typeof bucketToTypeRaw];

// these don't have bucket hashes but may be manually assigned to DimItems
export type D2AdditionalBucketTypes = 'Milestone' | 'Unknown';

// A mapping from the bucket hash to DIM item types
const bucketToType: {
  [hash: number]: DimBucketType | undefined;
} = bucketToTypeRaw;

const typeToSort: { [type: string]: D2BucketCategory } = {};
_.forIn(D2Categories, (types, category: D2BucketCategory) => {
  types.forEach((type) => {
    typeToSort[type] = category;
  });
});

export function getBuckets(defs: D2ManifestDefinitions) {
  const buckets: InventoryBuckets = {
    byHash: {},
    byType: {},
    byCategory: {},
    unknown: {
      description: 'Unknown items. DIM needs a manifest update.',
      name: 'Unknown',
      hash: -1,
      hasTransferDestination: false,
      capacity: Number.MAX_SAFE_INTEGER,
      sort: 'Unknown',
      type: 'Unknown',
      accountWide: false,
      category: BucketCategory.Item,
    },
    setHasUnknown() {
      this.byCategory[this.unknown.sort] = [this.unknown];
      this.byType[this.unknown.type] = this.unknown;
    },
  };
  _.forIn(defs.InventoryBucket, (def: DestinyInventoryBucketDefinition) => {
    const type = bucketToType[def.hash];
    let sort: D2BucketCategory | undefined;
    if (type) {
      sort = typeToSort[type];
    }
    const bucket: InventoryBucket = {
      description: def.displayProperties.description,
      name: def.displayProperties.name,
      hash: def.hash,
      hasTransferDestination: def.hasTransferDestination,
      capacity: def.itemCount,
      accountWide: def.scope === 1,
      category: def.category,
      type,
      sort,
    };
    if (bucket.type) {
      buckets.byType[bucket.type] = bucket;
    }
    // Add an easy helper property like "inPostmaster"
    if (bucket.sort) {
      bucket[`in${bucket.sort}`] = true;
    }
    buckets.byHash[bucket.hash] = bucket;
  });
  const vaultMappings = {};
  defs.Vendor.get(VENDORS.VAULT).acceptedItems.forEach((items) => {
    vaultMappings[items.acceptedInventoryBucketHash] = items.destinationInventoryBucketHash;
  });
  _.forIn(buckets.byHash, (bucket: InventoryBucket) => {
    if (vaultMappings[bucket.hash]) {
      bucket.vaultBucket = buckets.byHash[vaultMappings[bucket.hash]];
    }
  });
  _.forIn(D2Categories, (types, category) => {
    buckets.byCategory[category] = _.compact(types.map((type) => buckets.byType[type]));
  });
  return buckets;
}
