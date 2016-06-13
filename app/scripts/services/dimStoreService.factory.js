(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimSettingsService', 'dimPlatformService', 'dimItemTier', 'dimCategory', 'dimItemDefinitions', 'dimBucketService', 'dimStatDefinitions', 'dimObjectiveDefinitions', 'dimTalentDefinitions', 'dimSandboxPerkDefinitions', 'dimYearsDefinitions', 'dimProgressionDefinitions'];

  function StoreService($rootScope, $q, dimBungieService, settings, dimPlatformService, dimItemTier, dimCategory, dimItemDefinitions, dimBucketService, dimStatDefinitions, dimObjectiveDefinitions, dimTalentDefinitions, dimSandboxPerkDefinitions, dimYearsDefinitions, dimProgressionDefinitions) {
    var _stores = [];
    var _index = 0;
    var vaultSizes = {};
    var bucketSizes = {};
    var progressionDefs = {};
    dimBucketService.then(function(defs) {
      _.each(defs.byHash, function(def, hash) {
        if (def.enabled) {
          bucketSizes[hash] = def.capacity;
        }
      });
      vaultSizes['Weapons'] = defs.Weapons.capacity;
      vaultSizes['Armor'] = defs.Armor.capacity;
      vaultSizes['General'] = defs.General.capacity;
    });
    dimProgressionDefinitions.then(function(defs) {
      progressionDefs = defs;
    });

    // Cooldowns
    var cooldownsSuperA  = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
    var cooldownsSuperB  = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
    var cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
    var cooldownsMelee   = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

    // Prototype for Store objects - add methods to this to add them to all
    // stores.
    var StoreProto = {
      // Get the total amount of this item in the store, across all stacks,
      // excluding stuff in the postmaster.
      amountOfItem: function(item) {
        return sum(_.filter(this.items, function(i) {
          return i.hash === item.hash && !i.location.inPostmaster;
        }), 'amount');
      },
      // How much of items like this item can fit in this store?
      capacityForItem: function(item) {
        if (!item.bucket) {
          console.error("item needs a 'bucket' field", item);
          return 10;
        }
        return item.bucket.capacity;
      },
      // How many *more* items like this item can fit in this store?
      spaceLeftForItem: function(item) {
        if (!item.type) {
          throw new Error("item needs a 'type' field");
        }
        return Math.max(0, this.capacityForItem(item) - count(this.items, { type: item.type }));
      },
      updateCharacterInfo: function(characterInfo) {
        this.level = characterInfo.characterLevel;
        this.percentToNextLevel = characterInfo.percentToNextLevel / 100.0;
        this.powerLevel = characterInfo.characterBase.powerLevel;
        this.background = 'http://bungie.net/' + characterInfo.backgroundPath;
        this.icon = 'http://bungie.net/' + characterInfo.emblemPath;
        this.stats = getStatsData(characterInfo.characterBase);
      }
      // TODO: add/remove function that updates buckets, keeps track of counts??
    };

    // Prototype for Item objects - add methods to this to add them to all
    // items.
    var ItemProto = {
      // Can this item be equipped by the given store?
      canBeEquippedBy: function(store) {
        if (store.isVault) {
          return false;
        }
        return this.equipment &&
          // For the right class
          (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
          // nothing we are too low-level to equip
          this.equipRequiredLevel <= store.level &&
          // can be moved or is already here
          (!this.notransfer || this.owner === store.id) &&
          !this.location.inPostmaster;
      },
      isEngram: function() {
        return !this.equipment && this.typeName.toLowerCase().indexOf('engram') >= 0;
      },
      canBeInLoadout: function() {
        return this.equipment || this.type === 'Material' || this.type === 'Consumable';
      }
    };

    var service = {
      getStores: getStores,
      reloadStores: reloadStores,
      getStore: getStore,
      getStatsData: getStatsData,
      getBonus: getBonus,
      getVault: getStore.bind(null, 'vault'),
      updateCharacters: updateCharacters,
      createItemIndex: createItemIndex,
      processItems: getItems
    };

    $rootScope.$on('dim-settings-updated', function(setting) {
      if (_.has(setting, 'characterOrder')) {
        sortStores(_stores).then(function(stores) {
          _stores = stores;
        });
      }
    });

    return service;

    // Update the high level character information for all the stores
    // (level, light, int/dis/str, etc.). This does not update the
    // items in the stores - to do that, call reloadStores.
    function updateCharacters() {
      return dimBungieService.getCharacters(dimPlatformService.getActive()).then(function(bungieStores) {
        _.each(_stores, function(dStore) {
          if (!dStore.isVault) {
            var bStore = _.findWhere(bungieStores, { id: dStore.id });
            dStore.updateCharacterInfo(bStore.base);
          }
        });
        return _stores;
      });
    }

    function getNextIndex() {
      return _index++;
    }

    function sortStores(stores) {
      return settings.getSetting('characterOrder')
        .then(function(characterOrder) {
          if (characterOrder === 'mostRecent') {
            return _.sortBy(stores, 'lastPlayed').reverse();
          } else {
            return _.sortBy(stores, 'id');
          }
        });
    }

    function getStores() {
      return _stores;
    }

    // Returns a promise for a fresh view of the stores and their items.
    function reloadStores() {
      return dimBungieService.getStores(dimPlatformService.getActive())
        .then(function(rawStores) {
          var glimmer, marks;

          return $q.all(rawStores.map(function(raw) {
            var store;
            var items = [];
            if (!raw) {
              return undefined;
            }

            if (raw.id === 'vault') {
              store = angular.extend(Object.create(StoreProto), {
                id: 'vault',
                name: 'vault',
                class: 'vault',
                lastPlayed: '2005-01-01T12:00:01Z',
                icon: '/images/vault.png',
                background: '/images/vault-background.png',
                items: [],
                legendaryMarks: marks,
                glimmer: glimmer,
                bucketCounts: {},
                isVault: true,
                // Vault has different capacity rules
                capacityForItem: function(item) {
                  var sort = item.sort;
                  if (item.bucket) {
                    sort = item.bucket.sort;
                  }
                  if (!sort) {
                    throw new Error("item needs a 'sort' field");
                  }
                  return vaultSizes[sort];
                },
                spaceLeftForItem: function(item) {
                  var sort = item.sort;
                  if (item.bucket) {
                    sort = item.bucket.sort;
                  }
                  if (!sort) {
                    throw new Error("item needs a 'sort' field");
                  }
                  return Math.max(0, this.capacityForItem(item) - count(this.items, function(i) {
                    return i.bucket.sort == sort;
                  }));
                }
              });

              _.each(raw.data.buckets, function(bucket) {
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

              store = angular.extend(Object.create(StoreProto), {
                id: raw.id,
                icon: 'http://bungie.net/' + raw.character.base.emblemPath,
                lastPlayed: raw.character.base.characterBase.dateLastPlayed,
                background: 'http://bungie.net/' + raw.character.base.backgroundPath,
                level: raw.character.base.characterLevel,
                powerLevel: raw.character.base.characterBase.powerLevel,
                stats: getStatsData(raw.character.base.characterBase),
                class: getClass(raw.character.base.characterBase.classType),
                gender: getGender(raw.character.base.characterBase.genderType),
                race: getRace(raw.character.base.characterBase.raceHash),
                percentToNextLevel: raw.character.base.percentToNextLevel / 100.0,
                progression: raw.character.progression,
                isVault: false
              });
              store.name = store.gender + ' ' + store.race + ' ' + store.class;

              store.progression.progressions.forEach(function(prog) {
                angular.extend(prog, progressionDefs[prog.progressionHash]);
              });

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

            return $q.all([
              getItems(store.id, items),
              dimBucketService
            ]).then(function(values) {
              var items = values[0];
              var buckets = values[1];
              store.items = items;

              // by categories, then location-buckets
              /*
              store.itemCategories = _.mapObject(_.groupBy(items, function(i) {
                return i.location.sort;
              }), function(items) {
                return _.groupBy(items, function(i) {
                  return i.location.id;
                });
              });

              dimCategory.forEach(function(category) {
                category.forEach(function(type) {
                });
              });
               */

              // by type-bucket
              store.buckets = _.groupBy(items, function(i) {
                return i.location.id;
              });

              // TODO: updateItemModel in itemService will need to change!
              // or add a rebucket function??

              return store;
            });
          }));
        })
        .then(function(stores) {
          return sortStores(stores);
        })
        .then(function(stores) {
          _stores = stores;

          $rootScope.$broadcast('dim-stores-updated', {
            stores: stores
          });

          return stores;
        });
    }

    function getStore(id) {
      return _.find(_stores, { id: id });
    }

    var idTracker = {};

    // Set an ID for the item that should be unique across all items
    function createItemIndex(item) {
      // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
      var index = item.hash + '-';
      if (item.id === '0') {
        index = index + item.amount;
        idTracker[index] = (idTracker[index] || 0) + 1;
        index = index + '-' + idTracker[index];
      } else {
        index = index + item.id;
      }
      return index;
    }

    function processSingleItem(definitions, buckets, statDef, objectiveDef, perkDefs, talentDefs, yearsDefs, progressDefs, item) {
      var itemDef = definitions[item.itemHash];
      // Missing definition?
      if (!itemDef || itemDef.itemName === 'Classified') {
        // maybe it is classified...
        itemDef = {
          classified: true,
          icon: '/img/misc/missing_icon.png'
        };

        if (item.itemHash === 194424271) {
          itemType = 'Armor Shader';
          itemDef.bucketTypeHash = 2973005342;
          itemDef.classType = 3;
          itemDef.itemTypeName = 'Armor Shader';
          itemDef.description = '';
          itemDef.itemName = 'Walkabout - Classified';
          itemDef.nonTransferrable = true;
          itemDef.equipRequiredLevel = 0;
          itemDef.equipment = true;
          item.isEquipment = true;
        }

        if (item.itemHash === 1963806104) {
          itemType = 'Mystery Bag';
          itemDef.bucketTypeHash = 1469714392;
          itemDef.icon = "/common/destiny_content/icons/3651da8a8b0add3161e840c7104078ed.jpg";
          itemDef.classType = 3;
          itemDef.itemTypeName = itemType;
          itemDef.description = "Contains 1 Guaranteed Item and up to 4 Possible Items. This item is nonreturnable.";
          itemDef.itemName = "Sterling Treasure";
          itemDef.maxStackSize = 99;
          itemDef.nonTransferrable = true;
          itemDef.equipRequiredLevel = 0;
          itemDef.equipment = false;
          item.isEquipment = false;
        }

        // unidentified item.
        if (!itemDef.itemName) {
          console.warn('Missing Item Definition:\n\n', item, '\n\nplease contact a developer to get this item added.');
          window.onerror("Missing Item Definition - " + JSON.stringify(_.pick(item, 'canEquip', 'cannotEquipReason', 'equipRequiredLevel', 'isEquipment', 'itemHash', 'location', 'stackSize', 'talentGridHash')), 'dimStoreService.factory.js', 491, 11);
        }
      }

      if (!itemDef.itemTypeName || !itemDef.itemName) {
        return null;
      }

      // fix itemDef for defense items with missing nodes
      if (item.primaryStat && item.primaryStat.statHash === 3897883278 && _.size(itemDef.stats) > 0 && _.size(itemDef.stats) !== 5) {
        var defaultMinMax = _.find(itemDef.stats, function(stat) {
          return _.indexOf([144602215, 1735777505, 4244567218], stat.statHash) >= 0;
        });

        if(defaultMinMax) {
          [144602215, 1735777505, 4244567218].forEach(function(val) {
            if(!itemDef.stats[val]) {
              itemDef.stats[val] = {
                maximum: defaultMinMax.maximum,
                minimum: defaultMinMax.minimum,
                statHash: val,
                value: 0
              };
            }
          });
        }
      }

      // def.bucketTypeHash is where it goes normally
      var normalBucket = buckets.byHash[itemDef.bucketTypeHash];
      // item.bucket is where it IS right now
      var currentBucket = buckets.byHash[item.bucket] || normalBucket;

      // We cheat a bit for items in the vault, since we treat the
      // vault as a character. So put them in the bucket they would
      // have been in if they'd been on a character.
      if (currentBucket && currentBucket.id.startsWith('BUCKET_VAULT')) {
        currentBucket = normalBucket;
      }

      var itemType = 'Unknown';
      if (normalBucket) {
        itemType = normalBucket.type;
      }

      var weaponClass = null;
      if (normalBucket.inWeapons) {
        weaponClass = itemDef.itemTypeName.toLowerCase().replace(/\s/g, '');
      }

      var dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

      var createdItem = angular.extend(Object.create(ItemProto), {
        // The bucket the item is currently in
        location: currentBucket,
        // The bucket the item normally resides in (even though it may be in the vault/postmaster)
        bucket: normalBucket,
        hash: item.itemHash,
        // This is the type of the item (see dimCategory/dimBucketService) regardless of location
        type: itemType,
        tier: itemDef.tierTypeName || 'Common',
        name: itemDef.itemName,
        description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
        icon: itemDef.icon,
        notransfer: (currentBucket.inPostmaster || itemDef.nonTransferrable),
        id: item.itemInstanceId,
        equipped: item.isEquipped,
        equipment: item.isEquipment,
        complete: item.isGridComplete,
        percentComplete: null,
        amount: item.stackSize,
        primStat: item.primaryStat,
        typeName: itemDef.itemTypeName,
        // "perks" are the two or so talent grid items that are "featured" for an
        // item in its popup in the game. We don't currently use these.
        //perks: item.perks,
        equipRequiredLevel: item.equipRequiredLevel,
        maxStackSize: (itemDef.maxStackSize > 0) ? itemDef.maxStackSize : 1,
        // 0: titan, 1: hunter, 2: warlock, 3: any
        classType: itemDef.classType,
        classTypeName: getClass(itemDef.classType),
        dmg: dmgName,
        visible: true,
        year: (yearsDefs.year1.indexOf(item.itemHash) >= 0 ? 1 : 2),
        lockable: item.lockable,
        locked: item.locked,
        weaponClass: weaponClass || '',
        classified: itemDef.classified
      });
      createdItem.index = createItemIndex(createdItem);

      try {
        createdItem.talentGrid = buildTalentGrid(item, talentDefs, progressDefs, perkDefs);
      } catch(e) {
        console.error("Error building talent grid for " + createdItem.name, item, itemDef);
      }
      try {
        createdItem.stats = buildStats(item, itemDef, statDef, createdItem.talentGrid, itemType);
      } catch(e) {
        console.error("Error building stats for " + createdItem.name, item, itemDef);
      }
      try {
        createdItem.objectives = buildObjectives(item, objectiveDef, itemDef);
      } catch(e) {
        console.error("Error building objectives for " + createdItem.name, item, itemDef);
      }
      if(createdItem.talentGrid && createdItem.talentGrid.infusable) {
        try {
          createdItem.quality = getQualityRating(createdItem.stats, item.primaryStat, itemType);
        } catch(e) {
          console.error("Error building quality rating for " + createdItem.name, item, itemDef);
        }
      }

      // More objectives properties
      if (createdItem.objectives) {
        createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, 'complete');
        createdItem.percentComplete = sum(createdItem.objectives, function(objective) {
          return Math.min(1.0, objective.progress / objective.completionValue) / createdItem.objectives.length;
        });
      } else if (createdItem.talentGrid) {
        createdItem.percentComplete = Math.min(1.0, createdItem.talentGrid.totalXP / createdItem.talentGrid.totalXPRequired);
      }

      return createdItem;
    }

    function buildTalentGrid(item, talentDefs, progressDefs, perkDefs) {
      var talentGridDef = talentDefs[item.talentGridHash];
      if (!item.progression || !talentGridDef) {
        return undefined;
      }

      var totalXP = item.progression.currentProgress;
      var totalLevel = item.progression.level; // Can be way over max

      // progressSteps gives the XP needed to reach each level, with
      // the last element repeating infinitely.
      var progressSteps = progressDefs[item.progression.progressionHash].steps;
      // Total XP to get to specified level
      function xpToReachLevel(level) {
        if (level === 0) {
          return 0;
        }
        var totalXPRequired = 0;
        for (var step = 1; step <= level; step++) {
          totalXPRequired += progressSteps[Math.min(step, progressSteps.length) - 1];
        }

        return totalXPRequired;
      }

      var possibleNodes = talentGridDef.nodes;

      // var featuredPerkNames = item.perks.map(function(perk) {
      //   var perkDef = perkDefs[perk.perkHash];
      //   return perkDef ? perkDef.displayName : 'Unknown';
      // });

      var gridNodes = item.nodes.map(function(node) {
        var talentNodeGroup = possibleNodes[node.nodeHash];
        var talentNodeSelected = talentNodeGroup.steps[node.stepIndex];

        var nodeName = talentNodeSelected.nodeStepName;

        // Filter out some weird bogus nodes
        if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
          return undefined;
        }

        // Only one node in this column can be selected (scopes, etc)
        var exclusiveInColumn = !!(talentNodeGroup.exlusiveWithNodes &&
                                   talentNodeGroup.exlusiveWithNodes.length > 0);

        // Unlocked is whether or not the material cost has been paid
        // for the node
        var unlocked = node.isActivated ||
              talentNodeGroup.autoUnlocks ||
              // If only one can be activated, the cost only needs to be
              // paid once per row.
              (exclusiveInColumn &&
               _.any(talentNodeGroup.exlusiveWithNodes, function(nodeIndex) {
                 return item.nodes[nodeIndex].isActivated;
               }));

        // Calculate relative XP for just this node
        var startProgressionBarAtProgress = talentNodeSelected.startProgressionBarAtProgress;
        var activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;
        var xpRequired = xpToReachLevel(activatedAtGridLevel) - startProgressionBarAtProgress;
        var xp = Math.max(0, Math.min(totalXP - startProgressionBarAtProgress, xpRequired));

        // There's a lot more here, but we're taking just what we need
        return {
          name: nodeName,
          hash: talentNodeSelected.nodeStepHash,
          description: talentNodeSelected.nodeStepDescription,
          icon: talentNodeSelected.icon,
          // XP put into this node
          xp: xp,
          // XP needed for this node to unlock
          xpRequired: xpRequired,
          // Position in the grid
          column: talentNodeGroup.column,
          row: talentNodeGroup.row,
          // Is the node selected (lit up in the grid)
          activated: node.isActivated,
          // The item level at which this node can be unlocked
          activatedAtGridLevel: activatedAtGridLevel,
          // Only one node in this column can be selected (scopes, etc)
          exclusiveInColumn: exclusiveInColumn,
          // Whether there's enough XP in the item to buy the node
          xpRequirementMet: activatedAtGridLevel <= totalLevel,
          // Whether or not the material cost has been paid for the node
          unlocked: unlocked,
          // Some nodes don't show up in the grid, like purchased ascend nodes
          hidden: node.hidden

          // Whether (and in which order) this perk should be
          // "featured" on an abbreviated info panel, as in the
          // game. 0 = not featured, positive numbers signify the
          // order of the featured perks.
          //featuredPerk: (featuredPerkNames.indexOf(nodeName) + 1)

          // This list of material requirements to unlock the
          // item are a mystery. These hashes don't exist anywhere in
          // the manifest database. Also, the activationRequirement
          // object doesn't say how much of the material is
          // needed. There's got to be some missing DB somewhere with
          // this info.
          //materialsNeeded: talentNodeSelected.activationRequirement.materialRequirementHashes

          // These are useful for debugging or searching for new properties,
          // but they don't need to be included in the result.
          //talentNodeGroup: talentNodeGroup,
          //talentNodeSelected: talentNodeSelected,
          //itemNode: node
        };
      });
      gridNodes = _.compact(gridNodes);

      // This can be handy for visualization/debugging
      //var columns = _.groupBy(gridNodes, 'column');

      var maxLevelRequired = _.max(gridNodes, 'activatedAtGridLevel').activatedAtGridLevel;
      var totalXPRequired = xpToReachLevel(maxLevelRequired);

      var ascendNode = _.find(gridNodes, { name: 'Ascend' });

      // Fix for stuff that has nothing in early columns
      var minColumn = _.min(gridNodes, 'column').column;
      if (minColumn > 0) {
        gridNodes.forEach(function(node) { node.column -= minColumn; });
      }

      return {
        nodes: _.sortBy(gridNodes, function(node) { return node.column + 0.1 * node.row; }),
        xpComplete: totalXPRequired <= totalXP,
        totalXPRequired: totalXPRequired,
        totalXP: Math.min(totalXPRequired, totalXP),
        hasAscendNode: !!ascendNode,
        ascended: !!(ascendNode && ascendNode.activated),
        infusable: _.any(gridNodes, { name: 'Infuse' })
      };
    }

    function buildObjectives(item, objectiveDef, def) {
      if (!item.objectives || !item.objectives.length) {
        return undefined;
      }

      return item.objectives.map(function(objective) {
        var def = objectiveDef[objective.objectiveHash];

        return {
          description: def.displayDescription,
          progress: objective.progress,
          completionValue: def.completionValue,
          complete: objective.isComplete,
          boolean: def.completionValue === 1
        };
      });
    }

    function fitValue(light) {
      if (light > 300) {
        return 0.2546 * light - 23.825;
      } if (light > 200) {
        return 0.1801 * light - 1.4612;
      } else {
        return -1;
      }
    }

    function getScaledStat(base, light) {
      var max = 335;

      return {
        min: Math.floor((base)*(fitValue(max)/fitValue(light))),
        max: Math.floor((base+1)*(fitValue(max)/fitValue(light)))
      }
    }

    // thanks to bungie armory for the max-base stats
    // thanks to /u/iihavetoes for rates + equation
    // https://www.reddit.com/r/DestinyTheGame/comments/4geixn/a_shift_in_how_we_view_stat_infusion_12tier/
    // TODO set a property on a bucket saying whether it can have quality rating, etc
    function getQualityRating(stats, light, type) {
      var maxLight = 335;

      if (!stats || light.value < 280) {
        return null;
      }

      var split = 0;
      switch (type.toLowerCase()) {
        case 'helmet':
          split = 46; // bungie reports 48, but i've only seen 46
          break;
        case 'gauntlets':
          split = 41; // bungie reports 43, but i've only seen 41
          break;
        case 'chest':
          split = 61;
          break;
        case 'leg':
          split = 56;
          break;
        case 'classitem':
        case 'ghost':
          split = 25;
          break;
        case 'artifact':
          split = 38;
          break;
        default:
          return null;
      }

      var ret = {
        total: {
          min: 0,
          max: 0
        },
        max: split*2
      };

      var pure = 0;
      stats.forEach(function(stat) {
        var scaled = {
          min: 0,
          max: 0
        };
        if (stat.base) {
          scaled = getScaledStat(stat.base, light.value);
          pure = scaled.min;
        }
        stat.scaled = scaled;
        stat.split = split;
        stat.qualityPercentage = {
          min: Math.round(100 * stat.scaled.min / stat.split),
          max: Math.round(100 * stat.scaled.max / stat.split)
        }
        ret.total.min += scaled.min || 0;
        ret.total.max += scaled.max || 0;
      });

      if (pure === ret.total.min) {
        stats.forEach(function(stat) {
          stat.scaled = {
            min: Math.floor(stat.scaled.min / 2),
            max: Math.floor(stat.scaled.max / 2)
          };
          stat.qualityPercentage = {
            min: Math.round(100 * stat.scaled.min / stat.split),
            max: Math.round(100 * stat.scaled.max / stat.split)
          }
        });
      }


      var quality = {
        min: Math.round(ret.total.min / ret.max * 100),
        max: Math.round(ret.total.max / ret.max * 100)
      };

      if(type.toLowerCase() !== 'artifact') {
        stats.forEach(function(stat) {
          stat.qualityPercentage = {
            min: Math.min(100, stat.qualityPercentage.min),
            max: Math.min(100, stat.qualityPercentage.max)
          };
        });
        quality = {
          min: Math.min(100, quality.min),
          max: Math.min(100, quality.max)
        };
      }

      return quality;
    }

    // thanks to /u/iihavetoes for the bonuses at each level
    // thanks to /u/tehdaw for the spreadsheet with bonuses
    // https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0
    function getBonus(light, type) {
      switch(type.toLowerCase()) {
        case 'helmet':
        case 'helmets':
          return light < 292 ? 15 :
                 light < 307 ? 16 :
                 light < 319 ? 17 :
                 light < 332 ? 18 : 19;
        case 'gauntlets':
          return light < 287 ? 13 :
                 light < 305 ? 14 :
                 light < 319 ? 15 :
                 light < 333 ? 16 : 17;
        case 'chest':
        case 'chest armor':
          return light < 287 ? 20 :
                 light < 300 ? 21 :
                 light < 310 ? 22 :
                 light < 319 ? 23 :
                 light < 328 ? 24 : 25;
        case 'leg':
        case 'leg armor':
          return light < 284 ? 18 :
                 light < 298 ? 19 :
                 light < 309 ? 20 :
                 light < 319 ? 21 :
                 light < 329 ? 22 : 23;
        case 'classitem':
        case 'class items':
        case 'ghost':
        case 'ghosts':
          return light < 295 ? 8 :
                 light < 319 ? 9 : 10;
        case 'artifact':
        case 'artifacts':
          return light < 287 ? 34 :
                 light < 295 ? 35 :
                 light < 302 ? 36 :
                 light < 308 ? 37 :
                 light < 314 ? 38 :
                 light < 319 ? 39 :
                 light < 325 ? 40 :
                 light < 330 ? 41 : 42;
      }
      console.warn('item bonus not found', type);
      return 0;
    }

    function buildStats(item, itemDef, statDef, grid, type) {

      if (!item.stats || !item.stats.length || !itemDef.stats) {
        return undefined;
      }

      var armorNodes = [];
      var activeArmorNode;
      if (grid && grid.nodes && item.primaryStat.statHash === 3897883278) {
        armorNodes = _.filter(grid.nodes, function(node) {
          return _.contains(['Increase Intellect', 'Increase Discipline', 'Increase Strength'], node.name); //[1034209669, 1263323987, 193091484]
        });
        if (armorNodes) {
          activeArmorNode = _.findWhere(armorNodes, {activated: true}) || { hash: 0 };
        }
      }

      return _.sortBy(_.compact(_.map(itemDef.stats, function(stat) {
        var def = statDef[stat.statHash];
        if (!def) {
          return undefined;
        }

        var name = def.statName;
        if (name === 'Aim assistance') {
          name = 'Aim Assist';
        }

        // Only include these hidden stats, in this order
        var secondarySort = ['Aim Assist', 'Equip Speed'];
        var secondaryIndex = -1;

        var sort = _.findIndex(item.stats, { statHash: stat.statHash });
        var itemStat;
        if (sort < 0) {
          secondaryIndex = secondarySort.indexOf(name);
          sort = 50 + secondaryIndex;
        } else {
          itemStat = item.stats[sort];
          // Always at the end
          if (name === 'Magazine' || name === 'Energy') {
            sort = 100;
          }
        }

        if (!itemStat && secondaryIndex < 0) {
          return undefined;
        }

        var maximumValue = 100;
        if (itemStat && itemStat.maximumValue) {
          maximumValue = itemStat.maximumValue;
        }

        var val = itemStat ? itemStat.value : stat.value;
        var base = val;
        var bonus = 0;

        if (item.primaryStat.statHash === 3897883278) {
          if ((name === 'Intellect' && _.find(armorNodes, { name: 'Increase Intellect' })) ||
             (name === 'Discipline' && _.find(armorNodes, { name: 'Increase Discipline' })) ||
             (name === 'Strength' && _.find(armorNodes, { name: 'Increase Strength' }))) {
            bonus = getBonus(item.primaryStat.value, type);

            if (activeArmorNode &&
               (name === 'Intellect' && activeArmorNode.name === 'Increase Intellect') ||
               (name === 'Discipline' && activeArmorNode.name === 'Increase Discipline') ||
               (name === 'Strength' && activeArmorNode.name === 'Increase Strength')) {
              base = Math.max(0, val - bonus);
            }
          }
        }

        return {
          base: base,
          bonus: bonus,
          statHash: stat.statHash,
          name: name,
          sort: sort,
          value: val,
          maximumValue: maximumValue,
          bar: name !== 'Magazine' && name !== 'Energy' // energy == magazine for swords
        };
      })), 'sort');
    }

    function getItems(owner, items) {
      idTracker = {};
      return $q.all([
        dimItemDefinitions,
        dimBucketService,
        dimStatDefinitions,
        dimObjectiveDefinitions,
        dimSandboxPerkDefinitions,
        dimTalentDefinitions,
        dimYearsDefinitions,
        dimProgressionDefinitions])
        .then(function(args) {
          var result = [];
          _.each(items, function (item) {
            var createdItem = null;
            try {
              createdItem = processSingleItem.apply(undefined, args.concat(item));
            } catch(e) {
              console.error("Error processing item", item, e);
            }
            if (createdItem !== null) {
              createdItem.owner = owner;
              result.push(createdItem);
            }
          });
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

    //---- following code is from https://github.com/DestinyTrialsReport
    function getAbilityCooldown(subclass, ability, tier) {
      if (ability === 'STAT_INTELLECT') {
        switch (subclass) {
          case 2007186000: // Defender
          case 4143670656: // Nightstalker
          case 2455559914: // Striker
          case 3658182170: // Sunsinger
            return cooldownsSuperA[tier];
          default:
            return cooldownsSuperB[tier];
        }
      } else if (ability === 'STAT_DISCIPLINE') {
        return cooldownsGrenade[tier];
      } else if (ability === 'STAT_STRENGTH') {
        switch (subclass) {
          case 4143670656: // Nightstalker
          case 1716862031: // Gunslinger
            return cooldownsMelee[tier];
          default:
            return cooldownsGrenade[tier];
        }
      } else {
        return '-:--';
      }
    }

    function getStatsData(data) {
      var statsWithTiers = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH'];
      var stats = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH', 'STAT_ARMOR', 'STAT_RECOVERY', 'STAT_AGILITY'];
      var ret = {};
      for (var s = 0; s < stats.length; s++) {
        var statHash = {};
        switch(stats[s]) {
          case 'STAT_INTELLECT': statHash.name = 'Intellect'; statHash.effect = 'Super'; break;
          case 'STAT_DISCIPLINE': statHash.name = 'Discipline'; statHash.effect = 'Grenade'; break;
          case 'STAT_STRENGTH': statHash.name = 'Strength'; statHash.effect = 'Melee'; break;
        }
        if(!data.stats[stats[s]]) {
          continue;
        }
        statHash.value = data.stats[stats[s]].value;

        if (statsWithTiers.indexOf(stats[s]) > -1) {
          statHash.normalized = statHash.value > 300 ? 300 : statHash.value;
          statHash.tier = Math.floor(statHash.normalized / 60);
          statHash.tiers = [];
          statHash.remaining = statHash.value;
          for (var t = 0; t < 5; t++) {
            statHash.remaining -= statHash.tiers[t] = statHash.remaining > 60 ? 60 : statHash.remaining;
          }
          if(data.peerView) {
            statHash.cooldown = getAbilityCooldown(data.peerView.equipment[0].itemHash, stats[s], statHash.tier);
          }
          statHash.percentage = +(100 * statHash.normalized / 300).toFixed();
        } else {
          statHash.percentage = +(100 * statHash.value / 10).toFixed();
        }

        ret[stats[s]] = statHash;
      }
      return ret;
    }
    // code above is from https://github.com/DestinyTrialsReport
  }
})();
