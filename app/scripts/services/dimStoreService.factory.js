(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimSettingsService', 'dimPlatformService', 'dimItemTier', 'dimCategory', 'dimItemDefinitions', 'dimItemBucketDefinitions', 'dimStatDefinitions', 'dimObjectiveDefinitions', 'dimTalentDefinitions', 'dimSandboxPerkDefinitions', 'dimYearsDefinitions', 'dimProgressionDefinitions'];

  function StoreService($rootScope, $q, dimBungieService, settings, dimPlatformService, dimItemTier, dimCategory, dimItemDefinitions, dimItemBucketDefinitions, dimStatDefinitions, dimObjectiveDefinitions, dimTalentDefinitions, dimSandboxPerkDefinitions, dimYearsDefinitions, dimProgressionDefinitions) {
    var _stores = [];
    var _index = 0;

    // Cooldowns
    var cooldownsSuperA  = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
    var cooldownsSuperB  = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
    var cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
    var cooldownsMelee   = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

    var service = {
      getStores: getStores,
      getStore: getStore,
      updateStores: updateStores,
      setHeights: setHeights,
      getStatsData: getStatsData,
      getBonus: getBonus
    };

    return service;

    function updateStores(dimStores) {
      return dimBungieService.getCharacters(dimPlatformService.getActive()).then(function(bungieStores) {
        _.each(dimStores, function(dStore) {
          if (dStore.id !== 'vault') {
            var bStore = _.find(bungieStores, function(bStore) {
              return dStore.id === bStore.id;
            });

            dStore.level = bStore.base.characterLevel;
            dStore.percentToNextLevel = bStore.base.percentToNextLevel;
            dStore.powerLevel = bStore.base.characterBase.powerLevel;
            dStore.background = bStore.base.backgroundPath;
            dStore.icon = bStore.base.emblemPath;
            dStore.stats = getStatsData(bStore.base.characterBase);
          }
        });
        return dimStores;
      });
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
      setHeight('.sub-section.sort-quests');
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
                  stats: getStatsData(raw.character.base.characterBase),
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

    function processSingleItem(definitions, itemBucketDef, statDef, objectiveDef, perkDefs, talentDefs, yearsDefs, progressDefs, item) {
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

      var weaponClass = null, weaponClassName = null;


      if (!itemType) {
        return null;
      }

      if (itemType.hasOwnProperty('general') && itemType.general !== '') {
        weaponClass = itemType.weaponClass;
        weaponClassName = itemType.weaponClassName;
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

      var talentGrid = buildTalentGrid(item, talentDefs, progressDefs, perkDefs);

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
        amount: item.stackSize,
        primStat: item.primaryStat,
        stats: buildStats(item, itemDef, statDef, talentGrid, itemType),
        // "perks" are the two or so talent grid items that are "featured" for an
        // item in its popup in the game. We don't currently use these.
        //perks: item.perks,
        equipRequiredLevel: item.equipRequiredLevel,
        talentGrid: talentGrid,
        objectives: buildObjectives(item, objectiveDef, itemDef),
        maxStackSize: itemDef.maxStackSize,
        // 0: titan, 1: hunter, 2: warlock, 3: any
        classType: itemDef.classType,
        classTypeName: getClass(itemDef.classType),
        dmg: dmgName,
        visible: true,
        year: (yearsDefs.year1.indexOf(item.itemHash) >= 0 ? 1 : 2),
        lockable: item.lockable,
        locked: item.locked,
        weaponClass: weaponClass || '',
        weaponClassName: weaponClassName,
        classified: itemDef.classified
      };

      // More objectives properties
      if (createdItem.objectives) {
        createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, 'complete');
        createdItem.xpComplete = Math.floor(100 * sum(createdItem.objectives, function(objective) {
          return (objective.progress / objective.completionValue) / createdItem.objectives.length;
        }));
      }

      if(createdItem.hash === 2150667281) {
      console.log(createdItem)
      }

      return createdItem;
    }

    // Some utility functions missing from underscore
    function sum(list, summer) {
      return _.reduce(list, function(memo, val, index) {
        return memo + _.iteratee(summer)(val, index);
      }, 0);
    }

    // Count the number of "true" values
    function count(list, predicate) {
      return sum(list, function(item, index) {
        return _.iteratee(predicate)(item, index) ? 1 : 0;
      });
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

      var featuredPerkNames = item.perks.map(function(perk) {
        return perkDefs[perk.perkHash].displayName;
      });

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
          hidden: node.hidden,

          // Whether (and in which order) this perk should be
          // "featured" on an abbreviated info panel, as in the
          // game. 0 = not featured, positive numbers signify the
          // order of the featured perks.
          featuredPerk: (featuredPerkNames.indexOf(nodeName) + 1)

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
        hasReforgeNode: _.any(gridNodes, { name: 'Reforge Ready' }),
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

    // from https://github.com/CVSPPF/Destiny/blob/master/DestinyArmor.py#L14
    function getBonus(light, type) {
      type = type.toLowerCase();
      switch(type) {
        case 'helmet':
          return light < 291 ? 15 :
                 light < 307 ? 16 :
                 light < 319 ? 17 : 18;
        case 'gauntlets':
          return light < 287 ? 13 :
                 light < 305 ? 14 :
                 light < 319 ? 15 : 16;
        case 'chest':
          return light < 287 ? 20 :
                 light < 299 ? 21 :
                 light < 310 ? 22 :
                 light < 319 ? 23 : 24;
        case 'leg':
          return light < 284 ? 18 :
                 light < 298 ? 19 :
                 light < 309 ? 20 :
                 light < 319 ? 21 : 22;
        case 'classitem':
        case 'ghost':
          return light < 295 ? 8 :
                 light < 319 ? 9 : 10;
        case 'artifact':
          return light < 287 ? 34 :
                 light < 295 ? 35 :
                 light < 302 ? 36 :
                 light < 308 ? 37 :
                 light < 314 ? 38 :
                 light < 319 ? 39 : 40;
      }
      console.warn('item bonus not found');
      return 0;
    }

    function buildStats(item, itemDef, statDef, grid, type) {
      if (!item.stats || !item.stats.length) {
        return undefined;
      }

      var armorNodes, activeArmorNode;
      if(grid && grid.nodes && item.primaryStat.statHash === 3897883278) {
        armorNodes = _.filter(grid.nodes, function(node) {
          return _.contains(['Increase Intellect', 'Increase Discipline', 'Increase Strength'], node.name); //[1034209669, 1263323987, 193091484]
        });
        if(armorNodes) {
          activeArmorNode = _.findWhere(armorNodes, {activated: true}) || {hash: 0};
        }
      }

      return _.sortBy(_.compact(_.map(itemDef.stats, function(stat) {
        var def = statDef[stat.statHash];
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

        if(item.primaryStat.statHash === 3897883278) {
          if((name === 'Intellect' && _.find(armorNodes, {name: 'Increase Intellect'})) ||
             (name === 'Discipline' && _.find(armorNodes, {name: 'Increase Discipline'})) ||
             (name === 'Strength' && _.find(armorNodes, {name: 'Increase Strength'}))) {
            bonus = getBonus(item.primaryStat.value, type);

            if(activeArmorNode &&
               (name === 'Intellect' && activeArmorNode.name === 'Increase Intellect') ||
               (name === 'Discipline' && activeArmorNode.name === 'Increase Discipline') ||
               (name === 'Strength' && activeArmorNode.name === 'Increase Strength')) {
              base = val - bonus;
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
      return $q.all([
        dimItemDefinitions,
        dimItemBucketDefinitions,
        dimStatDefinitions,
        dimObjectiveDefinitions,
        dimSandboxPerkDefinitions,
        dimTalentDefinitions,
        dimYearsDefinitions,
        dimProgressionDefinitions])
        .then(function(args) {
          var result = [];
          _.each(items, function (item) {
            var createdItem = processSingleItem.apply(undefined, args.concat(item));
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
        weaponClass: type.toLowerCase().replace(/\s/g, ''),
        weaponClassName: type
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
        return 'Quests';
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
