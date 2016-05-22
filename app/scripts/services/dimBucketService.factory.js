(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimBucketService', BucketService);

  BucketService.$inject = ['dimItemBucketDefinitions', 'dimCategory'];

  function BucketService(dimItemBucketDefinitions, dimCategory) {
    // A mapping from the bucket names to DIM categories
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
        byName: {}
        // TODO: category heirarchy
      };
      _.each(bucketDefs, function(def, hash) {
        var bucket = def;
        if (bucket.enabled) {
          bucket.type = bucketToType[bucket.bucketIdentifier];
          if (bucket.type) {
            bucket.sort = typeToSort[bucket.type];
          } else if (vaultTypes[bucket.bucketIdentifier]) {
            bucket.sort = vaultTypes[bucket.bucketIdentifier];
            buckets[bucket.sort] = bucket;
          }

          buckets.byHash[hash] = bucket;
          buckets.byName[bucket.bucketIdentifier] = bucket;
        }
      });
      return buckets;
    });
  }
})();
