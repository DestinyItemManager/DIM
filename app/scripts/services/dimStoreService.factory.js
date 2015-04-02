(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimPlatformService', 'dimItemTier', 'dimCategory', 'dimItemDefs'];

  function StoreService($rootScope, $q, dimBungieService, dimPlatformService, dimItemTier, dimCategory, dimItemDefs) {
    var _stores = [];
    var _index = 0;

    var service = {
      getStores: getStores,
      getStore: getStore
    };

    return service;

    function getNextIndex() {
      return _index++;
    }

    function getStores(getFromBungie) {
      if (!getFromBungie) {
        return _stores;
      } else {
        var promise = dimBungieService.getStores(dimPlatformService.getActive())
          .then(function (stores) {
            _stores.splice(0);

            _.each(stores, function (raw) {
              var store;
              var items = [];

              if (raw.id === 'vault') {
                store = {
                  'id': 'vault',
                  'icon': '',
                  'items': [],
                  'bucketCounts': {},
                  hasExotic: function (type) {
                    var predicate = {
                      'tier': dimItemTier.exotic,
                      'type': type
                    };

                    return _.chain(items)
                      .where(predicate)
                      .value();
                  },
                  getTypeCount: function (item) {
                    return _.chain(this.items)
                      .filter(function (storeItem) {
                        return item.type === storeItem.type;
                      })
                      .size()
                      .value() < 10;
                  },
                  canEquipExotic: function (item) {
                    return this.getTypeCount(item);
                  }
                };

                _.each(raw.data.buckets, function (bucket) {
                  if (bucket.bucketHash === 3003523923)
                    store.bucketCounts.Armor = _.size(bucket.items);
                  if (bucket.bucketHash === 138197802)
                    store.bucketCounts.General = _.size(bucket.items);
                  if (bucket.bucketHash === 4046403665)
                    store.bucketCounts.Weapons = _.size(bucket.items);

                  items = _.union(items, bucket.items);
                });
              } else {
                store = {
                  id: raw.id,
                  icon: raw.character.base.emblemPath,
                  background: raw.character.base.backgroundPath,
                  level: raw.character.base.characterLevel,
                  class: getClass(raw.character.base.characterBase.classType),
                  gender: getGender(raw.character.base.characterBase.genderType),
                  race: getRace(raw.character.base.characterBase.raceHash),
                  isPrestigeLevel: raw.character.base.isPrestigeLevel,
                  percentToNextLevel: raw.character.base.percentToNextLevel,
                  hasExotic: function (type, equipped) {
                    var predicate = {
                      'tier': dimItemTier.exotic,
                      'type': type
                    };

                    if (!_.isUndefined(equipped)) {
                      predicate.equipped = equipped;
                    }

                    return _.chain(this.items)
                      .where(predicate)
                      .value();
                  },
                  getTypeCount: function (item) {
                    return _.chain(this.items)
                      .filter(function (storeItem) {
                        return item.type === storeItem.type;
                      })
                      .size()
                      .value() < 10;
                  },
                  canEquipExotic: function (itemType) {
                    var types = _.chain(dimCategory)
                      .pairs()
                      .find(function (cat) {
                        return _.some(cat[1],
                          function (type) {
                            return (type == itemType);
                          }
                        );
                      })
                      .value()[1];

                    return _.size(_.reduce(types, function (memo, type) {
                      return memo || this.hasExotic(type, true);
                    }, false, this)) === 0;
                  }
                };



                _.each(raw.data.buckets, function (bucket) {
                  _.each(bucket, function (pail) {
                    items = _.union(items, pail.items);
                  });
                });

              }

              var i = getItems(store.id, items, raw.definitions);

              i = _.sortBy(i, function(item) {
                return item.name;
              });

              i = _.sortBy(i, function (item) {

                switch (item.tier) {
                case 'Exotic':
                  return 0;
                case 'Legendary':
                  return 1;
                case 'Rare':
                  return 2;
                case 'Uncommon':
                  return 3;
                case 'Common':
                  return 4;
                default:
                  return 5;
                }
              });

              store.items = i;

              _stores.push(store);
            });

            return $q.when(_stores);
          })
          .then(function (stores) {
            $rootScope.$broadcast('dim-stores-updated', {
              stores: stores
            });

            return stores;
          });

        return promise;
      }
    }

    function getStore(id) {
      var store = _.find(_stores, function (store) {
        return store.id === id;
      });

      return $q.when(store);
    }

    function getItems(owner, items, definitions) {
      var result = [];

      var iterator = function (definitions, item, index) {
        var itemDef = _itemDefs[item.itemHash];

        // Missing definition?
        if (itemDef === undefined) {
          return;
        }

        if ((itemDef.type.indexOf('Bounty') != -1) || (itemDef.type.indexOf('Commendation') != -1)) {
          return;
        }

        var itemType = getItemType(itemDef.type, itemDef.name);

        if (!itemType) {
          return;
        }

        var itemSort = sortItem(itemDef.type);
        if (item.location === 4) {
          itemSort = 'Postmaster';
        }

        var dmgName = ['kinetic', , 'arc', 'solar', 'void'][item.damageType];

        result.push({
          index: getNextIndex(),
          owner: owner,
          hash: item.itemHash,
          type: itemType,
          sort: itemSort,
          tier: itemDef.tier,
          name: itemDef.name,
          icon: itemDef.icon,
          notransfer: itemDef.notransfer,
          id: item.itemInstanceId,
          equipped: item.isEquipped,
          equipment: item.isEquipment,
          complete: item.isGridComplete,
          amount: item.stackSize,
          primStat: item.primaryStat,
          stats: item.stats,
          maxStackSize: definitions.items[item.itemHash].maxStackSize,
          dmg: dmgName,
          visible: true
        });
      };

      var iteratorPB = iterator.bind(null, definitions);

      _.each(items, iteratorPB);

      return result;
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

    function getRace(hash) {
      switch (hash) {
      case 3887404748:
        return 'human';
      case 898834093:
        return 'exo';
      case 2803282938:
        return 'awoken';
      }
      return 'unknown';
    }

    function getGender(type) {
      switch (type) {
      case 0:
        return 'male';
      case 1:
        return 'female';
      }
      return 'unknown';
    }

    function getItemType(type, name) {
      //if(type.indexOf("Engram") != -1 || name.indexOf("Marks") != -1) {
      if (name.indexOf("Marks") != -1) {
        return null;
      }

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
      if (["Currency"].indexOf(type) != -1) {
        if (["Vanguard Marks", "Crucible Marks"].indexOf(name) != -1)
          return '';
        return 'Material';
      }
      if (["Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Consumable", "Material"].indexOf(type) != -1)
        return type.split(' ')[0];

      return null;
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
