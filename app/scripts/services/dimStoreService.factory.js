(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimSettingsService', 'dimPlatformService', 'dimItemTier', 'dimCategory', 'dimItemDefinitions', 'dimItemBucketDefinitions', 'dimStatDefinitions', 'dimObjectiveDefinitions', 'dimTalentDefinitions', 'dimSandboxPerkDefinitions', 'dimYearsDefinitions'];

  function StoreService($rootScope, $q, dimBungieService, settings, dimPlatformService, dimItemTier, dimCategory, dimItemDefinitions, dimItemBucketDefinitions, dimStatDefinitions, dimObjectiveDefinitions, dimTalentDefinitions, dimSandboxPerkDefinitions, dimYearsDefinitions) {
    var _stores = [];
    var _index = 0;

    var service = {
      getStores: getStores,
      getStore: getStore,
      updateStores: updateStores,
      setHeights: setHeights
    };

    return service;

    function updateStores() {
      return dimBungieService.getCharacters(dimPlatformService.getActive());
    }

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
      setHeight('.sub-section.sort-artifact');
      setHeight('.sub-section.sort-emblem');
      setHeight('.sub-section.sort-armor');
      setHeight('.sub-section.sort-ghost');
      setHeight('.sub-section.sort-emote');
      setHeight('.sub-section.sort-ship');
      setHeight('.sub-section.sort-vehicle');
      setHeight('.sub-section.sort-horn');
      setHeight('.sub-section.sort-consumable');
      setHeight('.sub-section.sort-material');
      setHeight('.sub-section.sort-missions');
      setHeight('.sub-section.sort-bounties');
      setHeight('.sub-section.sort-messages');
      setHeight('.sub-section.sort-special-orders');
      setHeight('.sub-section.sort-lost-items');
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
            var glimmer, marks;

            _.each(stores, function(raw) {
              var store;
              var items = [];

              if (raw.id === 'vault') {
                store = {
                  'id': 'vault',
                  'lastPlayed': '2005-01-01T12:00:01Z',
                  'icon': '',
                  'items': [],
                  legendaryMarks: marks,
                  glimmer: glimmer,
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

                  _.each(bucket.items, function(item) {
                    item.bucket = bucket.bucketHash;
                  });

                  items = _.union(items, bucket.items);
                });
              } else {


                try {
                  glimmer = _.find(raw.character.base.inventory.currencies, function(cur) { return cur.itemHash === 3159615086; }).value;
                  marks = _.find(raw.character.base.inventory.currencies, function(cur) { return cur.itemHash === 2534352370; }).value;
                } catch (e) {
                  glimmer = 0;
                  marks = 0;
                }

                store = {
                  id: raw.id,
                  icon: raw.character.base.emblemPath,
                  lastPlayed: raw.character.base.characterBase.dateLastPlayed,
                  background: raw.character.base.backgroundPath,
                  level: raw.character.base.characterLevel,
                  powerLevel: raw.character.base.characterBase.powerLevel,
                  class: getClass(raw.character.base.characterBase.classType),
                  gender: getGender(raw.character.base.characterBase.genderType),
                  race: getRace(raw.character.base.characterBase.raceHash),
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
                    _.each(pail.items, function(item) {
                      item.bucket = pail.bucketHash;
                    });

                    items = _.union(items, pail.items);
                  });
                });

                if (_.has(raw.character.base.inventory.buckets, 'Invisible')) {
                  if (_.size(raw.character.base.inventory.buckets.Invisible) > 0) {
                    _.each(raw.character.base.inventory.buckets.Invisible, function(pail) {
                      items = _.union(items, pail.items);
                    });
                  }

                }

              }

              var i = getItems(store.id, items)
                .then(function(items) {
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

    function processSingleItem(definitions, itemBucketDef, statDef, objectiveDef, perkDefs, talentDefs, yearsDefs, item) {
      var itemDef = definitions[item.itemHash];
      // Missing definition?
      if (itemDef === undefined || itemDef.itemName === 'Classified') {
        // maybe it is classified...
        itemDef = {
          classified: true,
          icon: '/img/misc/missing_icon.png'
        };

        // unidentified item.
        if(!itemDef.itemName) {
          console.warn('Missing Item Definition:\n\n', item, '\n\nplease contact a developer to get this item added.');
          window.onerror("Missing Item Definition - " + JSON.stringify(_.pick(item, 'canEquip', 'cannotEquipReason', 'equipRequiredLevel', 'isEquipment', 'itemHash', 'location', 'stackSize', 'talentGridHash')), 'dimStoreService.factory.js', 491, 11);
        }
      }

      if (_.isUndefined(itemDef.itemTypeName) || _.isUndefined(itemDef.itemName)) {
        return null;
      }

      var itemType = getItemType(item, itemDef, itemBucketDef);

      if (item.itemHash === 937555249) {
        itemType = "Material";
      }

      var weaponClass = null;


      if (!itemType) {
        return null;
      }

      if (itemType.hasOwnProperty('general') && itemType.general !== '') {
        weaponClass = itemType.weaponClass;
        itemType = itemType.general;
      }

      var itemSort = sortItem(itemDef.itemTypeName);

      if (_.isUndefined(itemSort)) {
        console.log(itemDef.itemTypeName + " does not have a sort property.");
      }

      if (item.location === 4) {
        itemSort = 'Postmaster';

        if (itemType !== 'Messages')
          if (itemType === 'Consumable') {
            itemType = 'Special Orders';
          } else {
            itemType = 'Lost Items';
          }
      }

      var dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

      // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
      var index = item.itemHash + '-';
      if (item.itemInstanceId === '0') {
        index = index + getNextIndex();
      } else {
        index = index + item.itemInstanceId;
      }

      /* Artifacts are missing appropiate class types
       0: titan, 1: hunter, 2: warlock, 3: any */
      var artifactTypes = ["Titan Artifact","Hunter Artifact","Warlock Artifact"];
      var artifactIndex = artifactTypes.indexOf(itemDef.itemTypeName);
      if(artifactIndex != -1)
      {
        itemDef.classType = artifactIndex;
      }

      var createdItem = {
        index: index,
        hash: item.itemHash,
        type: itemType,
        sort: itemSort,
        tier: (!_.isUndefined(itemDef.tierTypeName) ? itemDef.tierTypeName : 'Common'),
        name: itemDef.itemName,
        description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
        icon: itemDef.icon,
        notransfer: (itemSort !== 'Postmaster') ? itemDef.nonTransferrable : true,
        id: item.itemInstanceId,
        equipped: item.isEquipped,
        bucket: item.bucket,
        equipment: item.isEquipment,
        complete: item.isGridComplete,
        hasXP: (!!item.progression),
        xpComplete: 0,
        amount: item.stackSize,
        primStat: item.primaryStat,
        stats: item.stats,
        perks: item.perks,
        nodes: item.nodes,
        equipRequiredLevel: item.equipRequiredLevel,
        //talents: talentDefs[item.talentGridHash],
        talentPerks: getTalentPerks(item, talentDefs),
        maxStackSize: itemDef.maxStackSize,
        classType: itemDef.classType,
        classTypeName: getClass(itemDef.classType),
        /* 0: titan, 1: hunter, 2: warlock, 3: any */
        dmg: dmgName,
        visible: true,
        hasAscendNode: false,
        ascended: false,
        hasReforgeNode: false,
        infusable: false,
        year: (yearsDefs.year1.indexOf(item.itemHash) >= 0 ? 1 : 2),
        lockable: item.lockable,
        locked: item.locked,
        weaponClass: weaponClass || '',
        classified: itemDef.classified
      };

      // Bounties
      if (_.has(item, 'objectives') && (_.size(item.objectives) > 0) && (_.isNumber(item.objectives[0].objectiveHash))) {
        var objectiveDefObj = objectiveDef[item.objectives[0].objectiveHash],
            progressGoal = objectiveDefObj.completionValue > 0 ? objectiveDefObj.completionValue : 1;

        createdItem.complete = item.objectives[0].isComplete;
        createdItem.xpComplete = Math.floor(item.objectives[0].progress / progressGoal * 100);
      }

      _.each(item.stats, function(stat) {
        stat.name = statDef[stat.statHash].statName;
        stat.bar = stat.name !== 'Magazine' && stat.name !== 'Energy'; // energy == magazine for swords
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

      _.each(createdItem.perks, function(perk) {
        var perkDef = perkDefs[perk.perkHash];
        if (perkDef) {
          _.each(['displayName', 'displayDescription'], function(attr) {
            if (perkDef[attr]) {
              perk[attr] = perkDef[attr];
            }
          });
        }
      });

      // Only legendary or Exotic items are infusable.
      // Infuse perk's id is 1270552711
      createdItem.infusable = _.contains(createdItem.talentPerks, 1270552711);

      var talents = talentDefs[item.talentGridHash];

      if (talents) {
        var activePerks = _.pluck(createdItem.perks, 'displayName');

        var ascendNode = _.filter(talents.nodes, function(node) {
          return _.any(node.steps, function(step) {
            return step.nodeStepName === 'Ascend';
          });
        });

        if (!_.isEmpty(ascendNode)) {
          createdItem.hasAscendNode = true;
          var filteredAcendedTalent = _.filter(item.nodes, function(node) {
            return node.nodeHash === ascendNode[0].nodeHash;
          });

          createdItem.ascended = (filteredAcendedTalent.length > 0) ? filteredAcendedTalent[0].isActivated : false;

          if (!createdItem.ascended) {
            createdItem.complete = false;
          }
        }

        var reforgeNodes = _.filter(talents.nodes, function(node) {
          return _.any(node.steps, function(step) {
            return step.nodeStepName === 'Reforge Ready';
          });
        });

        // lets just see only the activated nodes for this item instance.
        var activated = _.filter(item.nodes, 'isActivated');

        // loop over the exclusive set talents grid for that weapon type
        _.each(talents.exclusiveSets, function(set) {
          _.each(activated, function(active) {
            if(set.nodeIndexes.indexOf(active.nodeHash) > -1) {

              var node = talents.nodes[active.nodeHash].steps[active.stepIndex];
              if(!_.contains(activePerks, node.nodeStepName)) {
                createdItem.perks.push({
                  displayName: node.nodeStepName,
                  displayDescription: node.nodeStepDescription,
                  iconPath: node.icon,
                  isActive: true,
                  order: active.column
                });
              } else {
                var perk = _.findIndex(createdItem.perks, {displayName: node.nodeStepName});

                createdItem.perks[perk].order = active.column;
              }
            }
          });
        });
        // other useful information about the item (this has info about reforge/etc)
        // _.each(talents.independentNodeIndexes, function(set) {

        createdItem.hasReforgeNode = !_.isEmpty(reforgeNodes);

        // Fill in order for stuff that wasn't "activated"
        _.each(createdItem.perks, function(perk) {
          if (!perk.order) {
            var node = _.find(talents.nodes, function(node) {
              return _.any(node.steps, function(step) { return step.nodeStepName == perk.displayName; });
            });

            if (node) {
              perk.order = node.column;
            }
          }
        });
      }

      // remove inactive perks, with this we actually lose passive perks (like exotic perks)
      createdItem.perks = _.filter(createdItem.perks, 'isActive');

      // sort the items by their node hashes
      createdItem.perks = _.sortBy(createdItem.perks, 'order');

      return createdItem;
    }

    function getItems(owner, items) {
      return $q.all([
        dimItemDefinitions,
        dimItemBucketDefinitions,
        dimStatDefinitions,
        dimObjectiveDefinitions,
        dimSandboxPerkDefinitions,
        dimTalentDefinitions,
        dimYearsDefinitions])
        .then(function(args) {
          var result = [];
          _.each(items, function (item) {
            var createdItem = processSingleItem.apply(undefined, args.concat(item));
            if (createdItem !== null) {
              createdItem.owner = owner;
              result.push(createdItem);
            }
          });
          console.timeEnd("StoreService");
          return result;
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

    function getTalentPerks(item, talents) {
      var talent = talents[item.talentGridHash];

      if (talent) {
        return _.chain(talent.nodes).map(function(node) {
            return node.steps;
          })
          .flatten()
          .pluck('nodeStepHash')
          .value();
      } else {
        return [];
      }
    }

    /* Not Implemented */
    // Engram,
    // Trials Reward,
    // Currency,
    // Material Exchange,
    // Equipment,
    // Invitation,
    // Camera,
    // Buff,
    // Bribe,
    // Incomplete Engrams,
    // Corrupted Engrams,

    function getItemType(item, def, buckets) {
      var type = def.itemTypeName;
      var name = def.itemName;

      if (def.bucketTypeHash === 3621873013) {
        return null;
      }

      if (def.bucketTypeHash === 2422292810) {
        if (item.location !== 4)
          return null;
      }

      if (def.bucketTypeHash === 375726501) {
        if (type.indexOf("Message ") != -1) {
          return 'Messages';
        }

        if (type.indexOf("Package") != -1) {
          return 'Messages';
        }

        if (["Public Event Completed"].indexOf(name) != -1) {
          return "Messages";
        }

        return 'Missions';
      }


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

      if (type === 'Mission Reward') {
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

        if (def.itemHash === 3012398149) {
          typeObj.general = 'Heavy';
        }
      }
      if (["Rocket Launcher", "Sword", "Machine Gun", "Heavy Weapon Engram"].indexOf(type) != -1)
        typeObj.general = 'Heavy';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Class Item Engram"].indexOf(type) != -1)
        return 'ClassItem';
      if (["Gauntlet Engram"].indexOf(type) != -1)
        return 'Gauntlets';
      if (type==='Mask') {
        return 'Helmet';
      }
      if (["Gauntlets", "Helmet", 'Mask', "Chest Armor", "Leg Armor", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram"].indexOf(type) != -1)
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
      if (["Commendation", "Trials of Osiris", "Faction Badge"].indexOf(type) != -1) {
        if (name.indexOf("Redeemed") != -1) {
          return null;
        }

        return 'Missions';
      }

      if (type.indexOf("Summoning Rune") != -1) {
        return "Material";
      }

      if (type.indexOf("Emote") != -1) {
        return "Emote";
      }

      if (type.indexOf("Artifact") != -1) {
        return "Artifact";
      }

      if (type.indexOf(" Bounty") != -1) {
        if (def.hasAction === true) {
          return 'Bounties';
        } else {
          return null;
        }
      }

      if (type.indexOf("Treasure Map") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Bounty Reward") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Queen's Orders") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Curio") != -1) {
        return 'Bounties';
      }
      if (type.indexOf("Vex Technology") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Horn") != -1) {
        return "Horn";
      }

      if (type.indexOf("Quest") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Relic") != -1) {
        return 'Bounties';
      }

      if (type.indexOf("Message ") != -1) {
        return 'Messages';
      }

      if (type.indexOf("Package") != -1) {
        return 'Messages';
      }

      if (type.indexOf("Armsday Order") != -1) {
        switch (def.bucketTypeHash) {
          case 2465295065:
            return 'Special';
          case 1498876634:
            return 'Primary';
          case 953998645:
            return 'Heavy';
          default:
            return 'Special Orders';
        }
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
      if (["Pulse Rifle", "Sword", "Sniper Rifle", "Shotgun", "Scout Rifle", "Sidearm", "Hand Cannon", "Fusion Rifle", "Rocket Launcher", "Auto Rifle", "Machine Gun", "Primary Weapon Engram", "Special Weapon Engram", "Heavy Weapon Engram"].indexOf(type) != -1)
        return 'Weapons';
      if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Gauntlets", "Helmet", 'Mask', "Chest Armor", "Leg Armor", "Class Item Engram"].indexOf(type) != -1)
        return 'Armor';
      if (["Quest Step", "Warlock Artifact", "Hunter Artifact", "Titan Artifact", "Faction Badge", "Treasure Map", "Vex Technology", "Curio", "Relic", "Summoning Rune", "Queen's Orders", "Crucible Bounty", "Vanguard Bounty", "Vehicle Upgrade", "Emote", "Restore Defaults", "Titan Subclass", "Hunter Subclass", "Warlock Subclass", "Horn", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Ship Schematics", "Vehicle", "Consumable", "Material", "Currency"].indexOf(type) != -1)
        return 'General';
      if (["Daily Reward", "Package", "Armsday Order"]) {
        return 'Postmaster';
      }

      if (type.indexOf("Message ") != -1) {
        return 'Postmaster';
      }
    }
  }
})();
