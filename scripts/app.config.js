(function () {
  angular.module('dimApp')
    .value('dimUserSystemIds', {
      xbl: {
        id: null,
        type: -1
      },
      psn: {
        id: null,
        type: -1
      }
    })
    .value('dimConfig', {
      'membershipId': -1,
      'active': {}
    })
    .run(appRun);

  appRun.$inject = ['dimBungieService', 'dimUserSystemIds', 'dimConfig', '$window'];

  function appRun(dimBungieService, dimUserSystemIds, dimConfig, $window) {
    var platformData = null;
    var storeData = null;

    dimBungieService.loadBungieNetUser()
      .then(function (data) {
        var bungieUser = data.Response;

        dimUserSystemIds.xbl.id = bungieUser.gamerTag;
        dimUserSystemIds.xbl.type = 1;

        dimUserSystemIds.psn.id = bungieUser.psnId;
        dimUserSystemIds.psn.type = 2;

        dimConfig.active = dimUserSystemIds.xbl;

        // if (!_.isNull(dimUserSystemIds.psn.id))
        //   dimConfig.active = dimUserSystemIds.psn;
      })
      .then(dimBungieService.loadDestinyUser)
      .then(function (data) {
        dimConfig.membershipId = data.Response[0].membershipId;
      })
      .then(dimBungieService.loadPlatformUser)
      .then(function (data) {
        dimConfig.characterIds = _.chain(data.Response.data.characters)
          .pluck('characterBase')
          .pluck('characterId')
          .value();
        platformData = data;
      })
      .then(dimBungieService.loadDestinyStores)
      .then(function (data) {
        storeData = data;
      })
      .then(remakeLegacy)
      .catch(function (data) {});

    function remakeLegacy() {
      var vaultDo = storeData[0].Response;

      var dimDo = $window.dimDO = {
        'stores': {
          'vault': {
            'id': 'vault',
            'icon': '',
            'items': [],
            'bucketCounts': {}
          }
        }
      };

      var owner = 'vault';
      var items = [];

      _.each(vaultDo.data.buckets, function (bucket) {
        if (bucket.bucketHash === 3003523923)
          dimDo.stores.vault.bucketCounts.Armor = _.size(bucket.items);
        if (bucket.bucketHash === 138197802)
          dimDo.stores.vault.bucketCounts.General = _.size(bucket.items);
        if (bucket.bucketHash === 4046403665)
          dimDo.stores.vault.bucketCounts.Weapons = _.size(bucket.items);

        items = _.union(items, bucket.items);
      });

      dimDo.stores.vault.items = getItems(owner, items, vaultDo.definitions);

      _.each(platformData.Response.data.characters, function (characterDo) {
        var id = characterDo.characterBase.characterId;

        dimDo.stores[id] = {
          id: id,
          icon: characterDo.emblemPath,
          background: characterDo.backgroundPath,
          level: characterDo.characterLevel,
          class: getClass(characterDo.characterBase.classType)
        };

        items = [];

        var storeDo = _.find(storeData[1], function(store) {
          return store.characterId === id;
        });

        _.each(storeDo.data.buckets, function (bucket) {
          _.each(bucket, function(pail) {
            items = _.union(items, pail.items);
          });
        });

        dimDo.stores[id].items = getItems(id, items, storeDo.definitions);
      });
    }

    function getClass(type) {
      switch (type) {
      case 0:
        return 'titan';
      case 1:
        return 'hunter';
      case 2:
        return 'warlock';
      }
      return 'unknown';
    }

    function getItems(owner, items, definitions) {
      var result = [];

      _.each(items, function (item, index) {
        var hash = item.itemHash;
        var def = definitions.items[hash];

        if (def.itemTypeName.indexOf('Bounty') != -1 || def.itemTypeName.indexOf('Commendation') != -1) {
          return;
        }

        var itemType = getItemType(def.itemTypeName, def.itemName);

        if (!itemType) {
          return;
        }

        var itemSort = sortItem(def.itemTypeName);

        if (item.location === 4) {
          itemSort = 'Postmaster';
        }

        var tierName = [, , 'basic', 'uncommon', 'rare', 'legendary', 'exotic'][def.tierType];
        var dmgName = ['kinetic', , 'arc', 'solar', 'void'][item.damageType];

        result.push({
          index: index,
          owner: owner,
          hash: hash,
          type: itemType,
          sort: itemSort,
          tier: tierName,
          name: def.itemName.replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;'),
          icon: def.icon,
          notransfer: def.nonTransferrable,
          id: item.itemInstanceId,
          equipped: item.isEquipped,
          equipment: item.isEquipment,
          complete: item.isGridComplete,
          amount: item.stackSize,
          primStat: item.primaryStat,
          stats: item.stats,
          dmg: dmgName
        });
      });

      return result;
    }


    function getItemType(type, name) {
      if (["Pulse Rifle", "Scout Rifle", "Hand Cannon", "Auto Rifle", "Primary Weapon Engram"].indexOf(type) != -1)
        return 'Primary';
      if (["Sniper Rifle", "Shotgun", "Fusion Rifle"].indexOf(type) != -1) {
        // detect special case items that are actually primary weapons.
        if (["Vex Mythoclast", "Universal Remote", "No Land Beyond", "Special Weapon Engram"].indexOf(name) != -1)
          return 'Primary';
        return 'Special';
      }
      if (["Rocket Launcher", "Machine Gun", "Heavy Weapon Engram"].indexOf(type) != -1)
        return 'Heavy';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond"].indexOf(type) != -1)
        return 'ClassItem';
      if (["Gauntlet Engram"].indexOf(type) != -1)
        return 'Gauntlets';
      if (["Gauntlets", "Helmet", "Chest Armor", "Leg Armor", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram"].indexOf(type) != -1)
        return type.split(' ')[0];
      if (["Titan Subclass", "Hunter Subclass", "Warlock Subclass"].indexOf(type) != -1)
        return 'Class';
      if (["Restore Defaults"].indexOf(type) != -1)
        return 'Armor';
      if (["Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Consumable", "Material", "Currency"].indexOf(type) != -1)
        return type.split(' ')[0];
    }

    function sortItem(type) {
      if (["Pulse Rifle", "Sniper Rifle", "Shotgun", "Scout Rifle", "Hand Cannon", "Fusion Rifle", "Rocket Launcher", "Auto Rifle", "Machine Gun", "Primary Weapon Engram", "Special Weapon Engram", "Heavy Weapon Engram"].indexOf(type) != -1)
        return 'Weapons';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
        return 'Armor';
      if (["Restore Defaults", "Titan Subclass", "Hunter Subclass", "Warlock Subclass", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Consumable", "Material", "Currency"].indexOf(type) != -1)
        return 'General';
    }
  }
})();
