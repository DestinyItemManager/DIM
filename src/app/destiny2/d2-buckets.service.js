import _ from 'underscore';

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
    'Clan Banners',
    'Vehicle',
    'Ships',
    'Emblems',
    'Emotes',
    'Engrams',
    'Auras'
  ],
  Inventory: [
    'Consumables',
    'Modifications',
    'Shaders'
  ],
  Postmaster: [
    'Lost Items',
    'Messages',
    'Special Orders'
  ]
};

// A mapping from the bucket names to DIM item types
// Some buckets like vault and currencies have been ommitted
// TODO: These have to change
// TODO: retire "DIM types" in favor of DestinyItemCategoryDefinitions
// TODO: there are no more bucket IDs... gotta update all this
// bucket hash to DIM type
const bucketToType = {
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
  4292445962: "Clan Banners",
  14239492: "Chest",
  18606351: "Shaders",
  20886954: "Leg",
  215593132: "Lost Items",
  284967655: "Ships",
  375726501: "Engrams",
  953998645: "Power",
  1269569095: "Auras",
  1367666825: "Special Orders",
  1498876634: "Kinetic",
  1585787867: "ClassItem",
  2025709351: "Vehicle",
  1469714392: "Consumables",
  138197802: "General"
};

export function D2BucketsService(D2Definitions, D2Categories) {
  'ngInject';

  const typeToSort = {};
  _.each(D2Categories, (types, category) => {
    types.forEach((type) => {
      typeToSort[type] = category;
    });
  });

  return {
    getBuckets: _.memoize(() => {
      return D2Definitions.getDefinitions().then((defs) => {
        const buckets = {
          byHash: {}, // numeric hash -> bucket
          byType: {}, // names ("ClassItem, Special") -> bucket
          byId: {}, // TODO hack
          byCategory: {}, // Mirrors the dimCategory heirarchy
          unknown: {
            description: 'Unknown items. DIM needs a manifest update.',
            name: 'Unknown',
            hash: -1,
            hasTransferDestination: false,
            capacity: Math.MAX_SAFE_INTEGER,
            sort: 'Unknown',
            type: 'Unknown'
          },
          setHasUnknown: function() {
            this.byCategory[this.unknown.sort] = [this.unknown];
            this.byType[this.unknown.type] = this.unknown;
          }
        };

        _.each(defs.InventoryBucket, (def) => {
          const bucket = {
            id: def.hash,
            description: def.displayProperties.description,
            name: def.displayProperties.name,
            hash: def.hash,
            hasTransferDestination: def.hasTransferDestination,
            capacity: def.itemCount,
            accountWide: def.scope === 1,
            category: def.category
          };

          bucket.type = bucketToType[bucket.hash];
          if (bucket.type) {
            bucket.sort = typeToSort[bucket.type];
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

        _.each(buckets.byHash, (bucket) => {
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
    })
  };
}

