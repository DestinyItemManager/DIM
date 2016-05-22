(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimBucketService', BucketService)
    // Categories (sorts) and the types within them
    .value('dimCategory', {
      Weapons: [
        'Class',
        'Primary',
        'Special',
        'Heavy',
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
        'Emblem',
        'Shader',
        'Emote',
        'Ship',
        'Vehicle',
        'Horn',
      ],
      Progress: [
        'Bounties',
        'Quests',
        'Missions',
      ],
      Postmaster: [
        'Lost Items',
        'Special Orders',
        'Messages'
      ]
    });

  BucketService.$inject = ['dimItemBucketDefinitions', 'dimCategory'];

  function BucketService(dimItemBucketDefinitions, dimCategory) {
    // A mapping from the bucket names to DIM item types
    // Some buckets like vault and currencies have been ommitted
    var bucketToType = {
      "BUCKET_CHEST": "Chest",
      "BUCKET_LEGS": "Leg",
      "BUCKET_RECOVERY": "Lost Items",
      "BUCKET_SHIP": "Ship",
      "BUCKET_MISSION": "Missions",
      "BUCKET_ARTIFACT": "Artifact",
      "BUCKET_HEAVY_WEAPON": "Heavy",
      "BUCKET_COMMERCIALIZATION": "Special Orders",
      "BUCKET_CONSUMABLES": "Consumable",
      "BUCKET_PRIMARY_WEAPON": "Primary",
      "BUCKET_CLASS_ITEMS": "ClassItem",
      "BUCKET_QUESTS": "Quests",
      "BUCKET_VEHICLE": "Vehicle",
      "BUCKET_BOUNTIES": "Bounties",
      "BUCKET_SPECIAL_WEAPON": "Special",
      "BUCKET_SHADER": "Shader",
      "BUCKET_EMOTES": "Emote",
      "BUCKET_MAIL": "Messages",
      "BUCKET_BUILD": "Class",
      "BUCKET_HEAD": "Helmet",
      "BUCKET_ARMS": "Gauntlets",
      "BUCKET_HORN": "Horn",
      "BUCKET_MATERIALS": "Material",
      "BUCKET_GHOST": "Ghost",
      "BUCKET_EMBLEM": "Emblem"
    };

    var vaultTypes = {
      "BUCKET_VAULT_ARMOR": 'Armor',
      "BUCKET_VAULT_WEAPONS": 'Weapons',
      "BUCKET_VAULT_ITEMS": 'General'
    };

    var typeToSort = {};
    _.each(dimCategory, function(types, category) {
      types.forEach(function(type) {
        typeToSort[type] = category;
      });
    });

    return dimItemBucketDefinitions.then(function(bucketDefs) {
      var buckets = {
        byHash: {},
        byId: {}
        // TODO: category heirarchy
      };
      _.each(bucketDefs, function(def, hash) {
        var bucket = def;
        if (bucket.enabled) {
          bucket.id = bucket.bucketIdentifier;
          bucket.type = bucketToType[bucket.id];
          if (bucket.type) {
            bucket.sort = typeToSort[bucket.type];
          } else if (vaultTypes[bucket.id]) {
            bucket.sort = vaultTypes[bucket.id];
            buckets[bucket.sort] = bucket;
          }

          buckets.byHash[hash] = bucket;
          buckets.byId[bucket.id] = bucket;
        }
      });
      return buckets;
    });
  }
})();
