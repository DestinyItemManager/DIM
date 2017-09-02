import _ from 'underscore';

// TODO: These have to change
// TODO: We can generate this based on making a tree from DestinyItemCategoryDefinitions
export const D2Categories = {
  Weapons: [
    'Class',
    'Kinetic',
    'Elemental',
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
  Progress: [
    'Bounties',
    'Quests',
    'Missions'
  ],
  Postmaster: [
    'Lost Items',
    'Special Orders',
    'Messages'
  ]
};

// A mapping from the bucket names to DIM item types
// Some buckets like vault and currencies have been ommitted
// TODO: These have to change
// TODO: retire "DIM types" in favor of DestinyItemCategoryDefinitions
// TODO: there are no more bucket IDs... gotta update all this
const bucketToType = {
  BUCKET_CHEST: "Chest",
  BUCKET_LEGS: "Leg",
  BUCKET_RECOVERY: "Lost Items",
  BUCKET_SHIP: "Ship",
  BUCKET_MISSION: "Missions",
  BUCKET_ARTIFACT: "Artifact",
  BUCKET_HEAVY_WEAPON: "Heavy",
  BUCKET_COMMERCIALIZATION: "Special Orders",
  BUCKET_CONSUMABLES: "Consumable",
  BUCKET_PRIMARY_WEAPON: "Primary",
  BUCKET_CLASS_ITEMS: "ClassItem",
  BUCKET_BOOK_LARGE: "RecordBook",
  BUCKET_BOOK_SMALL: "RecordBookLegacy",
  BUCKET_QUESTS: "Quests",
  BUCKET_VEHICLE: "Vehicle",
  BUCKET_BOUNTIES: "Bounties",
  BUCKET_SPECIAL_WEAPON: "Special",
  BUCKET_SHADER: "Shader",
  BUCKET_MODS: "Ornaments",
  BUCKET_EMOTES: "Emote",
  BUCKET_MAIL: "Messages",
  BUCKET_BUILD: "Class",
  BUCKET_HEAD: "Helmet",
  BUCKET_ARMS: "Gauntlets",
  BUCKET_HORN: "Horn",
  BUCKET_MATERIALS: "Material",
  BUCKET_GHOST: "Ghost",
  BUCKET_EMBLEM: "Emblem"
};

const vaultTypes = {
  BUCKET_VAULT_ARMOR: 'Armor',
  BUCKET_VAULT_WEAPONS: 'Weapons',
  BUCKET_VAULT_ITEMS: 'General'
};

export function D2BucketsService(dimDefinitions, D2Categories) {
  'ngInject';

  const typeToSort = {};
  _.each(D2Categories, (types, category) => {
    types.forEach((type) => {
      typeToSort[type] = category;
    });
  });

  return {
    getBuckets: _.memoize(() => {
      return dimDefinitions.getDefinitions().then((defs) => {
        const buckets = {
          byHash: {}, // numeric hash -> bucket
          byId: {}, // BUCKET_LEGS -> bucket
          byType: {}, // DIM types ("ClassItem, Special") -> bucket
          byCategory: {}, // Mirrors the dimCategory heirarchy
          unknown: {
            id: 'BUCKET_UNKNOWN',
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
            this.byId[this.unknown.id] = this.unknown;
            this.byType[this.unknown.type] = this.unknown;
          }
        };
        _.each(defs.InventoryBuckets, (def) => {
          if (def.enabled) {
            const bucket = {
              id: def.bucketIdentifier,
              description: def.bucketDescription,
              name: def.bucketName,
              hash: def.hash,
              hasTransferDestination: def.hasTransferDestination,
              capacity: def.itemCount
            };

            bucket.type = bucketToType[bucket.id];
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

