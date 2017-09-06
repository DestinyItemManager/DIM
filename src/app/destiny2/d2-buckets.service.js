import _ from 'underscore';

// TODO: These have to change
// TODO: We can generate this based on making a tree from DestinyItemCategoryDefinitions
export const D2Categories = {
  Weapons: [
    'Subclass',
    'Kinetic Weapons',
    'Energy Weapons',
    'Power Weapons'
  ],
  Armor: [
    'Helmet',
    'Gauntlets',
    'Chest Armor',
    'Leg Armor',
    'Class Armor'
  ],
  General: [
    'Ghost',
    'Modifications',
    'Emblems',
    'Shaders',
    'Emotes',
    'Ships',
    'Vehicle',
    'Auras',
    'Clan Banners'
  ],
  Postmaster: [
    'Lost Items',
    'Special Orders',
    'Messages'
  ]
};

const vaultTypes = {
  1469714392: 'Weapons',
  138197802: 'General',
};

// A mapping from the bucket names to DIM item types
// Some buckets like vault and currencies have been ommitted
// TODO: These have to change
// TODO: retire "DIM types" in favor of DestinyItemCategoryDefinitions
// TODO: there are no more bucket IDs... gotta update all this
// bucket hash to DIM type
const bucketToType = {
  2465295065: "Energy Weapons",
  2689798304: "Upgrade Point",
  2689798305: "Strange Coin",
  2689798308: "Glimmer",
  2689798309: "Legendary Shards",
  2689798310: "Silver",
  2689798311: "Bright Dust",
  2973005342: "Shaders",
  3054419239: "Emotes",
  3161908920: "Messages",
  3284755031: "Subclass",
  3313201758: "Modifications",
  3448274439: "Helmet",
  3551918588: "Gauntlets",
  3865314626: "Materials",
  4023194814: "Ghost",
  4274335291: "Emblems",
  4292445962: "Clan Banners",
  14239492: "Chest Armor",
  18606351: "Shaders",
  20886954: "Leg Armor",
  215593132: "Lost Items",
  284967655: "Ships",
  375726501: "Engrams",
  953998645: "Power Weapons",
  1269569095: "Auras",
  1367666825: "Special Orders",
  1498876634: "Kinetic Weapons",
  1585787867: "Class Armor",
  2025709351: "Vehicle"
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
          if (def.enabled) {
            const bucket = {
              id: def.hash,
              description: def.displayProperties.description,
              name: def.displayProperties.name,
              hash: def.hash,
              hasTransferDestination: def.hasTransferDestination,
              capacity: def.itemCount
            };

            bucket.type = bucketToType[bucket.hash];
            if (bucket.type) {
              bucket.sort = typeToSort[bucket.type];
              buckets.byType[bucket.type] = bucket;
            } else if (vaultTypes[bucket.id]) {
              bucket.sort = vaultTypes[bucket.id];
              buckets[bucket.sort] = bucket;
            }

            // Add an easy helper property like "inPostmaster"
            bucket[`in${bucket.sort}`] = true;

            buckets.byHash[bucket.hash] = bucket;
            buckets.byId[bucket.id] = bucket;
          }
        });

        // Hack in the fact that weapons and armor share vault space now
        buckets.Armor = buckets.byHash[138197802];

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

