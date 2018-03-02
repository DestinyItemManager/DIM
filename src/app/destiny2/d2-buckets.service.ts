import { IPromise } from 'angular';
import { BucketCategory, DestinyInventoryBucketDefinition } from 'bungie-api-ts/destiny2';
import * as _ from 'underscore';
import { getDefinitions } from './d2-definitions.service';

// TODO: These have to change
// TODO: We can generate this based on making a tree from DestinyItemCategoryDefinitions
export const D2Categories = {
  Weapons: [
    'Class',
    'Kinetic',
    'Energy',
    'Power'
  ],
  Armor: [
    'Helmet',
    'Gauntlets',
    'Chest',
    'Leg',
    'ClassItem'
  ],
  General: [
    'Ghost',
    'ClanBanners',
    'Vehicle',
    'Ships',
    'Emblems',
    'Emotes',
    'Engrams'
  ],
  Inventory: [
    'Consumables',
    'Modifications',
    'Shaders'
  ],
  Postmaster: [
    'LostItems',
    'Messages',
    'SpecialOrders'
  ]
};

// A mapping from the bucket names to DIM item types
// Some buckets like vault and currencies have been ommitted
// TODO: These have to change
// TODO: retire "DIM types" in favor of DestinyItemCategoryDefinitions
// TODO: there are no more bucket IDs... gotta update all this
// bucket hash to DIM type
const bucketToType: { [hash: number]: string | undefined } = {
  2465295065: "Energy",
  2689798304: "Upgrade Point",
  2689798305: "Strange Coin",
  2689798308: "Glimmer",
  2689798309: "Legendary Shards",
  2689798310: "Silver",
  2689798311: "Bright Dust",
  2973005342: "Shaders",
  3054419239: "Emotes",
  3161908920: "Messages",
  3284755031: "Class",
  3313201758: "Modifications",
  3448274439: "Helmet",
  3551918588: "Gauntlets",
  3865314626: "Materials",
  4023194814: "Ghost",
  4274335291: "Emblems",
  4292445962: "ClanBanners",
  14239492: "Chest",
  20886954: "Leg",
  215593132: "LostItems",
  284967655: "Ships",
  375726501: "Engrams",
  953998645: "Power",
  1269569095: "Auras",
  1367666825: "SpecialOrders",
  1498876634: "Kinetic",
  1585787867: "ClassItem",
  2025709351: "Vehicle",
  1469714392: "Consumables",
  138197802: "General"
};

export interface DimInventoryBucket {
  readonly id: number;
  readonly description: string;
  readonly name: string;
  readonly hash: number;
  readonly hasTransferDestination: boolean;
  readonly capacity: number;
  readonly accountWide: boolean;
  readonly category: BucketCategory;
  readonly type?: string;
  readonly sort?: string;
  vaultBucket?: DimInventoryBucket;
  // TODO: how to handle inPostmaster, etc? should probably be a function
  inPostmaster?: boolean;
  inWeapons?: boolean;
  inArmor?: boolean;
  inGeneral?: boolean;
  inInventory?: boolean;
}

export interface DimInventoryBuckets {
  byHash: { [hash: number]: DimInventoryBucket };
  byType: { [type: string]: DimInventoryBucket };
  byId: { [hash: number]: DimInventoryBucket };
  byCategory: { [category: string]: DimInventoryBucket[] };
  unknown: DimInventoryBucket; // TODO: get rid of this?
  setHasUnknown();
}

const typeToSort: { [type: string]: string } = {};
_.each(D2Categories, (types, category) => {
  types.forEach((type) => {
    typeToSort[type] = category;
  });
});

export const getBuckets = _.memoize(getBucketsUncached) as () => IPromise<DimInventoryBuckets>;

function getBucketsUncached() {
  return getDefinitions().then((defs) => {
    const buckets: DimInventoryBuckets = {
      byHash: {}, // numeric hash -> bucket
      byType: {}, // names ("ClassItem, Special") -> bucket
      byId: {}, // TODO hack
      byCategory: {}, // Mirrors the dimCategory heirarchy
      unknown: {
        description: 'Unknown items. DIM needs a manifest update.',
        name: 'Unknown',
        id: -1,
        hash: -1,
        hasTransferDestination: false,
        capacity: Number.MAX_SAFE_INTEGER,
        sort: 'Unknown',
        type: 'Unknown',
        accountWide: false,
        category: BucketCategory.Item
      },
      setHasUnknown() {
        this.byCategory[this.unknown.sort] = [this.unknown];
        this.byType[this.unknown.type] = this.unknown;
      }
    };

    _.each(defs.InventoryBucket, (def: DestinyInventoryBucketDefinition) => {
      const id = def.hash;
      const type = bucketToType[def.hash];
      let sort: string | undefined;
      if (type) {
        sort = typeToSort[type];
      }

      const bucket: DimInventoryBucket = {
        id,
        description: def.displayProperties.description,
        name: def.displayProperties.name,
        hash: id,
        hasTransferDestination: def.hasTransferDestination,
        capacity: def.itemCount,
        accountWide: def.scope === 1,
        category: def.category,
        type,
        sort
      };

      if (bucket.type) {
        buckets.byType[bucket.type] = bucket;
      }

      // Add an easy helper property like "inPostmaster"
      if (bucket.sort) {
        bucket[`in${bucket.sort}`] = true;
      }

      buckets.byHash[bucket.hash] = bucket;
      buckets.byId[bucket.id] = bucket;
    });

    const vaultMappings = {};
    defs.Vendor.get(1037843411).acceptedItems.forEach((items) => {
      vaultMappings[items.acceptedInventoryBucketHash] = items.destinationInventoryBucketHash;
    });

    _.each(buckets.byHash, (bucket: DimInventoryBucket) => {
      if (vaultMappings[bucket.hash]) {
        bucket.vaultBucket = buckets.byHash[vaultMappings[bucket.hash]];
      }
    });

    _.each(D2Categories, (types, category) => {
      buckets.byCategory[category] = _.compact(types.map((type) => {
        return buckets.byType[type];
      }));
    });

    return buckets;
  });
}
