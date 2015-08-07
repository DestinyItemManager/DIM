(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimSettingsService', 'dimPlatformService', 'dimItemTier', 'dimCategory', 'dimItemDefinitions', 'dimTalentDefinitions'];

  function StoreService($rootScope, $q, dimBungieService, settings, dimPlatformService, dimItemTier, dimCategory, dimItemDefinitions, dimTalentDefinitions) {
    var _stores = [];
    var _index = 0;

    var service = {
      getStores: getStores,
      getStore: getStore,
      setHeights: setHeights
    };

    return service;

    function getNextIndex() {
      return _index++;
    }

    function setHeights() {
      function outerHeight(el) {
        //var height = el.offsetHeight;
        var style = getComputedStyle(el);

        var height = parseInt(style.height);
        return height;
      }

      function outerWidth(el) {
        var width = el.offsetWidth;
        var style = getComputedStyle(el);

        width += parseInt(style.marginLeft) + parseInt(style.marginRight);
        return width;
      }

      var fn = function(memo, section) {
        var childHeight = 0;

        _.each(section.children, function(child) {
          var t = outerHeight(child);
          childHeight = (childHeight > t) ? childHeight : t;
        });

        if (childHeight > memo) {
          memo = childHeight;
        }

        return memo;
      };

      var setHeight = function(query) {
        var height = _.reduce(document.querySelectorAll(query), fn, 0);

        var style = document.querySelectorAll('style[id=' + ((query.replace(/\./g, '')).replace(/\s/g, '')) + ']');

        if (style.length > 0) {
          style = style[0];
        } else {
          style = document.createElement('style');
          style.type = 'text/css';
          style.id = (query.replace(/\./g, '')).replace(/\s/g, '');
          document.getElementsByTagName('head')[0].appendChild(style);
        }

        style.innerHTML = query + ' { min-height: ' + (height) + 'px; }';
      };

      setHeight('.sub-section.sort-class');
      setHeight('.sub-section.sort-primary');
      setHeight('.sub-section.sort-special');
      setHeight('.sub-section.sort-heavy');
      setHeight('.sub-section.sort-helmet');
      setHeight('.sub-section.sort-chest');
      setHeight('.sub-section.sort-gauntlets');
      setHeight('.sub-section.sort-leg');
      setHeight('.sub-section.sort-classitem');
      setHeight('.sub-section.sort-emblem');
      setHeight('.sub-section.sort-armor');
      setHeight('.sub-section.sort-ghost');
      setHeight('.sub-section.sort-ship');
      setHeight('.sub-section.sort-vehicle');
      setHeight('.sub-section.sort-consumable');
      setHeight('.sub-section.sort-material');
      setHeight('.sub-section.sort-missions');
      setHeight('.sub-section.sort-bounties');
      setHeight('.weapons');
      setHeight('.armor');
      setHeight('.general');
    }

    function getStores(getFromBungie, withOrder) {
      if (!getFromBungie && !!withOrder) {
        return settings.getSetting('characterOrder')
          .then(function(characterOrder) {
            if (characterOrder === 'mostRecent') {
              return _.sortBy(_stores, 'lastPlayed').reverse();
            } else {
              return _.sortBy(_stores, 'id');
            }
          });
      } else if (!getFromBungie && _.isUndefined(withOrder)) {
        return _stores;
      } else {
        var promise = dimBungieService.getStores(dimPlatformService.getActive())
          .then(function(stores) {
            _stores.splice(0);
            var asyncItems = [];

            _.each(stores, function(raw) {
              var store;
              var items = [];

              if (raw.id === 'vault') {
                store = {
                  'id': 'vault',
                  'lastPlayed': '2005-01-01T12:00:01Z',
                  'icon': '',
                  'items': [],
                  'bucketCounts': {},
                  hasExotic: function(type) {
                    var predicate = {
                      'tier': dimItemTier.exotic,
                      'type': type
                    };

                    return _.chain(items)
                      .where(predicate)
                      .value();
                  },
                  getTypeCount: function(item) {
                    return _.chain(this.items)
                      .filter(function(storeItem) {
                        return item.type === storeItem.type;
                      })
                      .size()
                      .value() < 10;
                  },
                  canEquipExotic: function(item) {
                    return this.getTypeCount(item);
                  }
                };

                _.each(raw.data.buckets, function(bucket) {
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
                  lastPlayed: raw.character.base.characterBase.dateLastPlayed,
                  background: raw.character.base.backgroundPath,
                  level: raw.character.base.characterLevel,
                  class: getClass(raw.character.base.characterBase.classType),
                  gender: getGender(raw.character.base.characterBase.genderType),
                  race: getRace(raw.character.base.characterBase.raceHash),
                  isPrestigeLevel: raw.character.base.isPrestigeLevel,
                  percentToNextLevel: raw.character.base.percentToNextLevel,
                  hasExotic: function(type, equipped) {
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
                  getTypeCount: function(item) {
                    return _.chain(this.items)
                      .filter(function(storeItem) {
                        return item.type === storeItem.type;
                      })
                      .size()
                      .value() < 10;
                  },
                  canEquipExotic: function(itemType) {
                    var types = _.chain(dimCategory)
                      .pairs()
                      .find(function(cat) {
                        return _.some(cat[1],
                          function(type) {
                            return (type == itemType);
                          }
                        );
                      })
                      .value()[1];

                    return _.size(_.reduce(types, function(memo, type) {
                      return memo || this.hasExotic(type, true);
                    }, false, this)) === 0;
                  }
                };



                _.each(raw.data.buckets, function(bucket) {
                  _.each(bucket, function(pail) {
                    items = _.union(items, pail.items);
                  });
                });

              }

              var i = getItems(store.id, items, raw.definitions)
                .then(function(items) {
                  items = _.sortBy(items, function(item) {
                    return item.name;
                  });

                  items = _.sortBy(items, function(item) {

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

                  store.items = items;

                  _stores.push(store);

                  return store;
                });

              asyncItems.push(i);
            });

            return $q.all(asyncItems);
          })
          .then(function() {
            var stores = _stores;

            return $q(function(resolve, reject) {
              settings.getSetting('characterOrder')
                .then(function(characterOrder) {
                  if (characterOrder === 'mostRecent') {
                    resolve(_.sortBy(stores, 'lastPlayed').reverse());
                  } else {
                    resolve(_.sortBy(stores, 'id'));
                  }
                });
            });
          })
          .then(function(stores) {
            $rootScope.$broadcast('dim-stores-updated', {
              stores: stores
            });

            return stores;
          });

        return promise;
      }
    }

    function getStore(id) {
      var store = _.find(_stores, function(store) {
        return store.id === id;
      });

      return $q.when(store);
    }

    function getItems(owner, items, definitions) {
      var result = [];

      var statNames = {
        2391494160:"Light",
        2523465841:"Velocity",
        2715839340:"Recoil direction",
        2961396640:"Charge Rate",
        2996146975:"Agility",
        3555269338:"Optics",
        3597844532:"Precision Damage",
        3614673599:"Blast Radius",
        3871231066:"Magazine",
        3897883278:"Defense",
        3907551967:"Move speed",
        3988418950:"ADS Speed",
        4043523819:"Impact",
        4188031367:"Reload",
        4244567218:"Strength",
        4284893193:"Rate of Fire",
        144602215:"Intellect",
        155624089:"Stability",
        360359141:"Durability",
        368428387:"Attack",
        392767087:"Armor",
        943549884:"Equip Speed",
        1240592695:"Range",
        1345609583:"Aim assistance",
        1501155019:"Speed",
        1735777505:"Discipline",
        1931675084:"Inventory Size",
        1943323491:"Recovery"
      }, how = [27147831,
        42955693,
        67667123,
        90237898,
        218050499,
        265815054,
        335523232,
        339830484,
        393928834,
        396000457,
        458051526,
        503662095,
        523254923,
        539209176,
        561917151,
        624069029,
        714364949,
        775290250,
        795669148,
        860021733,
        882909349,
        995864459,
        904421510,
        1066225282,
        1089438744,
        1107880514,
        1160431986,
        1220059831,
        1254374620,
        1254481871,
        1264686852,
        1323306343,
        1402638106,
        1451036562,
        1519653029,
        1550472824,
        1594939317,
        1656716862,
        1828077147,
        1847790745,
        1873618131,
        2012670844,
        2026407600,
        2083636246,
        2166567782,
        2204090140,
        2205157361,
        2218769485,
        2225640336,
        2254085097,
        2291003580,
        2328256155,
        2438950138,
        2465557612,
        2475938409,
        2480655802,
        2535110885,
        2557913516,
        2558819340,
        2582896251,
        2591286232,
        2642620856,
        2668404053,
        2729377859,
        2733667410,
        2741119693,
        2762611443,
        2773297359,
        2834869470,
        2858888526,
        3072387149,
        3013056390,
        3083393861,
        3102889189,
        3170350942,
        3252749793,
        3604975945,
        3698237992,
        3744470365,
        3904617893,
        3975149217,
        3992691386,
        4029879832,
        4068960035,
        4143281036,
        4160874107,
        4248486431
      ];

      var iterator = function(definitions, talentDefs, item, index) {
        var itemDef = definitions[item.itemHash];

        // Missing definition?
        if (itemDef === undefined) {
          return;
        }

        if (_.isUndefined(itemDef.itemTypeName) || _.isUndefined(itemDef.itemName)) {
          return;
        }

        // if ((itemDef.type.indexOf('Bounty') != -1) || (itemDef.type.indexOf('Commendation') != -1)) {
        //   return;
        // }

        var itemType = getItemType(itemDef.itemTypeName, itemDef.itemName);
        var weaponClass = null;

        if (!itemType) {
          return;
        }

        if (itemType.hasOwnProperty('general') && itemType.general !== '') {
          weaponClass = itemType.weaponClass;
          itemType = itemType.general;
        }

        var itemSort = sortItem(itemDef.itemTypeName);

        if (item.location === 4) {
          itemSort = 'Postmaster';

          if (itemType !== 'Messages')
            itemType = 'Lost Items';
        }

        var dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

        var createdItem = {
          index: getNextIndex(),
          owner: owner,
          hash: item.itemHash,
          type: itemType,
          sort: itemSort,
          tier: itemDef.tierTypeName,
          name: itemDef.itemName,
          icon: itemDef.icon,
          inHoW: _.contains(how, itemDef.itemHash),
          notransfer: (itemSort !== 'Postmaster') ? itemDef.nonTransferrable : true,
          id: item.itemInstanceId,
          equipped: item.isEquipped,
          equipment: item.isEquipment,
          complete: item.isGridComplete,
          hasXP: (!!item.progression),
          xpComplete: (!!item.progression && item.progression.progressToNextLevel === 0 && item.progression.currentProgress > 0),
          amount: item.stackSize,
          primStat: item.primaryStat,
          stats: item.stats,
          perks: item.perks,
          maxStackSize: definitions[item.itemHash].maxStackSize,
          classType: itemDef.classType,
          /* 0: titan, 1: hunter, 2: warlock, 3: any */
          dmg: dmgName,
          visible: true,
          hasAscendNode: false,
          ascended: false,
          lockable: item.lockable,
          locked: item.locked,
          weaponClass: weaponClass || ''
        };

        _.each(item.stats, function(stat) {
          stat.name = statNames[stat.statHash];
          stat.bar = stat.statHash !== 3871231066 && item.primaryStat.statHash !== 3897883278;
        });

        if (item.itemHash === 2809229973) { // Necrochasm
          createdItem.hasXP = true;
          createdItem.xpComplete = true;
          createdItem.complete = true;
        }

        // Fixes items that are marked as complete, but the data didn't reflect
        // that status.  Must be a bug in Bungie's data.
        if (createdItem.complete) {
          createdItem.hasXP = true;
          createdItem.xpComplete = true;
        }

        var talents = talentDefs.data[item.talentGridHash];

        var ascendNode = (talents) ? _.filter(talents.nodes, function(node) {
          return _.some(node.steps, function(step) {
            return step.nodeStepName === 'Ascend';
          });
        }) : undefined;

        // var talentDef = null;
        //
        // dimTalentDefinitions.getDefinitions()
        //   .then(function(defs) {
        //
        //   });

        // var ascendNode = _.find(item.nodes, function(node) {
        //   return (node.state === 6);
        // });

        if (!_.isUndefined(ascendNode) && _.size(ascendNode) > 0) {
          createdItem.hasAscendNode = true;
          createdItem.ascended = _.filter(item.nodes, function(node) {
            return node.nodeHash === ascendNode[0].nodeHash;
          })[0].isActivated;

          if (!createdItem.ascended) {
            createdItem.complete = false;
          }
        }

        // if (!_.isUndefined(ascendNode)) {
        //   if ((!ascendNode.isActivated) && (item.primaryStat)) {
        //     if ((item.primaryStat.statHash === 368428387) && (item.primaryStat.value === 331)) {
        //
        //     }
        //
        //   }
        // }

        if (createdItem.tier !== 'Basic') {
          result.push(createdItem);
        }
      };

      var iteratorPB;

      var promise = dimItemDefinitions.getDefinitions()
        .then(function(defs) {
          iteratorPB = iterator.bind(null, defs);
        })
        .then(dimTalentDefinitions.getDefinitions)
        .then(function(defs) {
          iteratorPB = iteratorPB.bind(null, defs);

          _.each(items, iteratorPB);

          return result;
        });

      return promise;
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
      if (_.isUndefined(type) || _.isUndefined(name)) {
        return {
          'general': 'General',
          'weaponClass': 'General'
        };
      }

      //if(type.indexOf("Engram") != -1 || name.indexOf("Marks") != -1) {
      if (name.indexOf("Marks") != -1) {
        return null;
      }

      // Used to find a "weaponClass" type to send back
      var typeObj = {
        general: '',
        weaponClass: type.toLowerCase().replace(/\s/g, '')
      };

      if (["Pulse Rifle", "Scout Rifle", "Hand Cannon", "Auto Rifle", "Primary Weapon Engram"].indexOf(type) != -1)
        typeObj.general = 'Primary';
      if (["Sniper Rifle", "Shotgun", "Fusion Rifle", "Sidearm", "Special Weapon Engram"].indexOf(type) != -1) {
        typeObj.general = 'Special';

        // detect special case items that are actually primary weapons.
        if (["Vex Mythoclast", "Universal Remote", "No Land Beyond"].indexOf(name) != -1) {
          typeObj.general = 'Primary';
        }
      }
      if (["Rocket Launcher", "Machine Gun", "Heavy Weapon Engram"].indexOf(type) != -1)
        typeObj.general = 'Heavy';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Class Item Engram"].indexOf(type) != -1)
        return 'ClassItem';
      if (["Gauntlet Engram"].indexOf(type) != -1)
        return 'Gauntlets';
      if (["Gauntlets", "Helmet", "Chest Armor", "Leg Armor", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram"].indexOf(type) != -1)
        return (type.split(' ')[0] === 'Body') ? "Chest" : type.split(' ')[0];
      if (["Titan Subclass", "Hunter Subclass", "Warlock Subclass"].indexOf(type) != -1)
        return 'Class';
      if (["Restore Defaults"].indexOf(type) != -1)
        return 'Armor';
      if (["Currency"].indexOf(type) != -1) {
        if (["Vanguard Marks", "Crucible Marks"].indexOf(name) != -1)
          return '';
        return 'Material';
      }
      if (["Commendation", "Trials of Osiris"].indexOf(type) != -1) {
        if (name.indexOf("Redeemed") != -1) {
          return null;
        }

        return 'Missions';
      }

      if (type.indexOf(" Bounty") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Quest") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Package") != -1) {
        return 'Messages';
      }

      if (typeObj.general !== '') {
        return typeObj;
      }

      if (["Public Event Completed"].indexOf(name) != -1) {
        return "Messages";
      }

      if (["Vehicle Upgrade"].indexOf(type) != -1) {
        return "Consumable";
      }

      if (["Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Consumable", "Material", "Ship Schematics"].indexOf(type) != -1)
        return type.split(' ')[0];

      return null;
    }

    function sortItem(type) {
      if (["Pulse Rifle", "Sniper Rifle", "Shotgun", "Scout Rifle", "Sidearm", "Hand Cannon", "Fusion Rifle", "Rocket Launcher", "Auto Rifle", "Machine Gun", "Primary Weapon Engram", "Special Weapon Engram", "Heavy Weapon Engram"].indexOf(type) != -1)
        return 'Weapons';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Gauntlets", "Helmet", "Chest Armor", "Leg Armor", "Class Item Engram"].indexOf(type) != -1)
        return 'Armor';
      if (["Restore Defaults", "Titan Subclass", "Hunter Subclass", "Warlock Subclass", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Consumable", "Material", "Currency"].indexOf(type) != -1)
        return 'General';
    }
  }
})();
