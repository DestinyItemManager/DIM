import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .controller('dimMinMaxCtrl', dimMinMaxCtrl);


function dimMinMaxCtrl($scope, $rootScope, $state, $q, $timeout, $location, $translate, dimSettingsService, dimStoreService, ngDialog, dimFeatureFlags, dimLoadoutService, dimDefinitions, dimVendorService) {
  var vm = this;
  vm.featureFlags = dimFeatureFlags;

  if (dimStoreService.getStores().length === 0) {
    $state.go('inventory');
    return;
  }

  var buckets = [];
  var vendorBuckets = [];
  var perks = {
    warlock: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    titan: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    hunter: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] }
  };
  var vendorPerks = {
    warlock: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    titan: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    hunter: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] }
  };

  function getBonusType(armorpiece) {
    if (!armorpiece.normalStats) {
      return '';
    }
    return (armorpiece.normalStats[144602215].bonus > 0 ? 'int ' : '') +
      (armorpiece.normalStats[1735777505].bonus > 0 ? 'dis ' : '') +
      (armorpiece.normalStats[4244567218].bonus > 0 ? 'str' : '');
  }

  function getBestItem(armor, stats, type, nonExotic) {
    // for specifc armor (Helmet), look at stats (int/dis), return best one.
    return {
      item: _.max(armor, function(o) {
        if (nonExotic && o.isExotic) {
          return 0;
        }
        var bonus = 0;
        var total = 0;
        stats.forEach(function(stat) {
          var scaleType = (o.tier === 'Rare') ? 'base' : vm.scaleType;
          total += o.normalStats[stat][scaleType];
          bonus = o.normalStats[stat].bonus;
        });
        return total + bonus;
      }),
      bonusType: type
    };
  }

  function hasPerks(item, lockedPerks) {
    if (_.isEmpty(lockedPerks)) {
      return true;
    }

    var andPerkHashes = _.map(_.filter(_.keys(lockedPerks), function(perkHash) { return lockedPerks[perkHash].lockType === 'and'; }), Number);
    var orPerkHashes = _.map(_.filter(_.keys(lockedPerks), function(perkHash) { return lockedPerks[perkHash].lockType === 'or'; }), Number);

    return _.some(orPerkHashes, function(perkHash) { return _.findWhere(item.talentGrid.nodes, { hash: perkHash }); }) ||
           (andPerkHashes.length && _.every(andPerkHashes, function(perkHash) { return _.findWhere(item.talentGrid.nodes, { hash: perkHash }); }));
  }

  function fillTiers(stats) {
    _.each(stats, function(stat) {
      stat.tier = Math.min(Math.floor(stat.value / 60), 5);
      stat.value = stat.value % 60;
      stat.tiers = new Array(5).fill(0);
      _.each([0, 1, 2, 3, 4], function(tier) {
        stat.tiers[tier] = (tier <= stat.tier) ? ((tier === stat.tier) ? stat.value : 60) : 0;
      });
    });
  }

  function calcArmorStats(set) {
    _.each(set.armor, function(armor) {
      var int = armor.item.normalStats[144602215];
      var dis = armor.item.normalStats[1735777505];
      var str = armor.item.normalStats[4244567218];

      var scaleType = (armor.item.tier === 'Rare') ? 'base' : vm.scaleType;

      set.stats.STAT_INTELLECT.value += int[scaleType];
      set.stats.STAT_DISCIPLINE.value += dis[scaleType];
      set.stats.STAT_STRENGTH.value += str[scaleType];

      switch (armor.bonusType) {
      case 'int': set.stats.STAT_INTELLECT.value += int.bonus; break;
      case 'dis': set.stats.STAT_DISCIPLINE.value += dis.bonus; break;
      case 'str': set.stats.STAT_STRENGTH.value += str.bonus; break;
      }
    });

    fillTiers(set.stats);
  }

  function getBonusConfig(armor) {
    return {
      Helmet: armor.Helmet.bonusType,
      Gauntlets: armor.Gauntlets.bonusType,
      Chest: armor.Chest.bonusType,
      Leg: armor.Leg.bonusType,
      ClassItem: armor.ClassItem.bonusType,
      Artifact: armor.Artifact.bonusType,
      Ghost: armor.Ghost.bonusType
    };
  }

  function genSetHash(armor) {
    return _.map(armor, function(piece) { return piece.item.id; }).join('');
  }

  function getBestArmor(bucket, vendorBucket, locked, excluded, lockedPerks) {
    var statHashes = [
        { stats: [144602215, 1735777505], type: 'intdis' },
        { stats: [144602215, 4244567218], type: 'intstr' },
        { stats: [1735777505, 4244567218], type: 'disstr' },
        { stats: [144602215], type: 'int' },
        { stats: [1735777505], type: 'dis' },
        { stats: [4244567218], type: 'str' }
    ];
    var armor = {};
    var best = [];
    var curbest;
    var bestCombs;
    var armortype;

    for (armortype in bucket) {
      var combined = (vm.includeVendors) ? bucket[armortype].concat(vendorBucket[armortype]) : bucket[armortype];
      if (locked[armortype]) {
        best = [{ item: locked[armortype], bonusType: getBonusType(locked[armortype]) }];
      } else {
        best = [];

        // Filter out excluded and non-wanted perks
        var filtered = _.filter(combined, function(item) {
          return !_.findWhere(excluded, { index: item.index }) && hasPerks(item, lockedPerks[armortype]); // Not excluded and has the correct locked perks
        });

        statHashes.forEach(function(hash, index) {
          if (!vm.fullMode && index > 2) {
            return;
          }

          curbest = getBestItem(filtered, hash.stats, hash.type);
          best.push(curbest);
          // add the best -> if best is exotic -> get best legendary
          if (curbest.item.isExotic && armortype !== 'ClassItem') {
            best.push(getBestItem(filtered, hash.stats, hash.type, true));
          }
        });
      }

      bestCombs = [];
      _.each(_.uniq(best, false, function(o) {
        return o.item.index;
      }), function(obj) {
        obj.bonusType = getBonusType(obj.item);
        if (obj.bonusType === '') {
          bestCombs.push({ item: obj.item, bonusType: '' });
        }
        if (obj.bonusType.indexOf('int') > -1) {
          bestCombs.push({ item: obj.item, bonusType: 'int' });
        }
        if (obj.bonusType.indexOf('dis') > -1) {
          bestCombs.push({ item: obj.item, bonusType: 'dis' });
        }
        if (obj.bonusType.indexOf('str') > -1) {
          bestCombs.push({ item: obj.item, bonusType: 'str' });
        }
      });
      armor[armortype] = bestCombs;
    }
    return armor;
  }

  function getActiveHighestSets(setMap, activeSets) {
    var count = 0;
    var topSets = [];
    _.each(setMap, function(setType) {
      if (count >= 10) {
        return;
      }

      if (setType.tiers[activeSets]) {
        topSets.push(setType);
        count += 1;
      }
    });
    return topSets;
  }

  function validSet(gearset) {
    return (
      gearset.Helmet.item.isExotic +
      gearset.Gauntlets.item.isExotic +
      gearset.Chest.item.isExotic +
      gearset.Leg.item.isExotic
    ) < 2;
  }

  function getId(index) {
    var split = index.split('-');
    return split[1] === '1' ? index : split[1];
  }

  function getItemById(id, type) {
    return _.findWhere(buckets[vm.active][type], { id: id }) || _.findWhere(vendorBuckets[vm.active][type], { index: id });
  }

  function alreadyExists(set, id) {
    return _.findWhere(set, { id: id }) || _.findWhere(set, { index: id });
  }

  function mergeBuckets(bucket1, bucket2) {
    var merged = {};
    _.each(_.keys(bucket1), function(type) {
      merged[type] = bucket1[type].concat(bucket2[type]);
    });
    return merged;
  }

  function getActiveBuckets(bucket1, bucket2, merge) {
    // Merge both buckets or return bucket1 if merge is false
    return (merge) ? mergeBuckets(bucket1, bucket2) : bucket1;
  }

  function filterLoadoutToEquipped(loadout) {
    var filteredLoadout = angular.copy(loadout);
    filteredLoadout.items = _.mapObject(filteredLoadout.items, function(items) {
      return _.select(items, 'equipped');
    });
    return filteredLoadout;
  }

  dimDefinitions.getDefinitions().then(function(defs) {
    angular.extend(vm, {
      active: 'titan',
      i18nClassNames: _.object(['titan', 'hunter', 'warlock'], _.pluck(_.sortBy(defs.Class, function(classDef) { return classDef.classType; }), 'className')),
      i18nItemNames: _.object(['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'], _.map([45, 46, 47, 48, 49, 38, 39], function(key) { return defs.ItemCategory.get(key).title; })),
      activesets: '5/5/2',
      type: 'Helmet',
      scaleType: vm.featureFlags.qualityEnabled ? 'scaled' : 'base',
      progress: 0,
      fullMode: false,
      includeVendors: false,
      showBlues: false,
      showExotics: true,
      showYear1: false,
      allSetTiers: [],
      hasSets: true,
      highestsets: {},
      activeHighestSets: [],
      ranked: {},
      activePerks: {},
      excludeditems: [],
      collapsedConfigs: [false, false, false, false, false, false, false, false, false, false],
      lockeditems: { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null },
      lockedperks: { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} },
      setOrderValues: ['-str_val', '-dis_val', '-int_val'],
      lockedItemsValid: function(droppedId, droppedType) {
        droppedId = getId(droppedId);
        if (alreadyExists(vm.excludeditems, droppedId)) {
          return false;
        }

        var item = getItemById(droppedId, droppedType);
        var startCount = ((item.isExotic && item.type !== 'ClassItem') ? 1 : 0);
        return (
          startCount +
          (droppedType !== 'Helmet' && vm.lockeditems.Helmet && vm.lockeditems.Helmet.isExotic) +
          (droppedType !== 'Gauntlets' && vm.lockeditems.Gauntlets && vm.lockeditems.Gauntlets.isExotic) +
          (droppedType !== 'Chest' && vm.lockeditems.Chest && vm.lockeditems.Chest.isExotic) +
          (droppedType !== 'Leg' && vm.lockeditems.Leg && vm.lockeditems.Leg.isExotic)
        ) < 2;
      },
      excludedItemsValid: function(droppedId, droppedType) {
        return !(vm.lockeditems[droppedType] && alreadyExists([vm.lockeditems[droppedType]], droppedId));
      },
      onSelectedChange: function(prevIdx, selectedIdx) {
        if (vm.activeCharacters[prevIdx].class !== vm.activeCharacters[selectedIdx].class) {
          vm.active = vm.activeCharacters[selectedIdx].class;
          vm.onCharacterChange();
          vm.selectedCharacter = selectedIdx;
        }
      },
      onCharacterChange: function() {
        vm.ranked = getActiveBuckets(buckets[vm.active], vendorBuckets[vm.active], vm.includeVendors);
        vm.activeCharacters = _.reject(dimStoreService.getStores(), function(s) { return s.isVault; });
        var activeStore = dimStoreService.getActiveStore();
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, function(char) { return char.id === activeStore.id; });
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
        vm.excludeditems = _.filter(vm.excludeditems, function(item) { return item.hash === 2672107540; });
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onActiveSetsChange: function() {
        vm.activeHighestSets = getActiveHighestSets(vm.highestsets, vm.activesets);
      },
      onModeChange: function() {
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onIncludeVendorsChange: function() {
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        if (vm.includeVendors) {
          vm.ranked = mergeBuckets(buckets[vm.active], vendorBuckets[vm.active]);
        } else {
          vm.ranked = buckets[vm.active];

          // Filter any vendor items from locked or excluded items
          _.each(vm.lockeditems, function(item, type) {
            if (item && item.isVendorItem) {
              vm.lockeditems[type] = null;
            }
          });

          vm.excludeditems = _.filter(vm.excludeditems, function(item) {
            return !item.isVendorItem;
          });

          // Filter any vendor perks from locked perks
          _.each(vm.lockedperks, function(perkMap, type) {
            vm.lockedperks[type] = _.omit(perkMap, function(perk, perkHash) {
              return _.findWhere(vendorPerks[vm.active][type], { hash: Number(perkHash) });
            });
          });
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onPerkLocked: function(perk, type, $event) {
        var activeType = 'none';
        if ($event.shiftKey) {
          activeType = (vm.lockedperks[type][perk.hash] && vm.lockedperks[type][perk.hash].lockType === 'and') ? 'none' : 'and';
        } else {
          activeType = (vm.lockedperks[type][perk.hash] && vm.lockedperks[type][perk.hash].lockType === 'or') ? 'none' : 'or';
        }

        if (activeType === 'none') {
          delete vm.lockedperks[type][perk.hash];
        } else {
          vm.lockedperks[type][perk.hash] = { icon: perk.icon, description: perk.description, lockType: activeType };
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.perkschanged = true;
        }
      },
      onDrop: function(droppedId, type) {
        droppedId = getId(droppedId);
        if (vm.lockeditems[type] && alreadyExists([vm.lockeditems[type]], droppedId)) {
          return;
        }
        var item = getItemById(droppedId, type);
        vm.lockeditems[type] = item;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      onRemove: function(removedType) {
        vm.lockeditems[removedType] = null;

        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      excludeItem: function(item) {
        vm.onExcludedDrop(item.index, item.type);
      },
      onExcludedDrop: function(droppedId, type) {
        droppedId = getId(droppedId);
        if (alreadyExists(vm.excludeditems, droppedId) || (vm.lockeditems[type] && alreadyExists([vm.lockeditems[type]], droppedId))) {
          return;
        }
        var item = getItemById(droppedId, type);
        vm.excludeditems.push(item);
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.excludedchanged = true;
        }
      },
      onExcludedRemove: function(removedIndex) {
        vm.excludeditems = _.filter(vm.excludeditems, function(excludeditem) { return excludeditem.index !== removedIndex; });
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.excludedchanged = true;
        }
      },
      lockEquipped: function() {
        var store = vm.activeCharacters[vm.selectedCharacter];
        var loadout = filterLoadoutToEquipped(store.loadoutFromCurrentlyEquipped(""));
        var items = _.pick(loadout.items,
                               'helmet',
                               'gauntlets',
                               'chest',
                               'leg',
                               'classitem',
                               'artifact',
                               'ghost');
        // Do not lock items with no stats
        vm.lockeditems.Helmet = items.helmet[0].stats ? items.helmet[0] : null;
        vm.lockeditems.Gauntlets = items.gauntlets[0].stats ? items.gauntlets[0] : null;
        vm.lockeditems.Chest = items.chest[0].stats ? items.chest[0] : null;
        vm.lockeditems.Leg = items.leg[0].stats ? items.leg[0] : null;
        vm.lockeditems.ClassItem = items.classitem[0].stats ? items.classitem[0] : null;
        vm.lockeditems.Artifact = items.artifact[0].stats ? items.artifact[0] : null;
        vm.lockeditems.Ghost = items.ghost[0].stats ? items.ghost[0] : null;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      clearLocked: function() {
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      newLoadout: function(set) {
        ngDialog.closeAll();
        var loadout = { items: {} };
        var items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        _.each(items, function(itemContainer, itemType) {
          loadout.items[itemType.toLowerCase()] = [itemContainer.item];
        });
        loadout.classType = ({ warlock: 0, titan: 1, hunter: 2 })[vm.active];

        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout,
          equipAll: true
        });
      },
      equipItems: function(set) {
        ngDialog.closeAll();
        var loadout = { items: {}, name: $translate.instant('Loadouts.AppliedAuto') };
        var items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        loadout.items.helmet = [items.Helmet.item];
        loadout.items.chest = [items.Chest.item];
        loadout.items.gauntlets = [items.Gauntlets.item];
        loadout.items.leg = [items.Leg.item];
        loadout.items.classitem = [items.ClassItem.item];
        loadout.items.ghost = [items.Ghost.item];
        loadout.items.artifact = [items.Artifact.item];
        loadout.classType = ({ warlock: 0, titan: 1, hunter: 2 })[vm.active];

        loadout = angular.copy(loadout);

        _.each(loadout.items, function(val) {
          val[0].equipped = true;
        });

        return dimLoadoutService.applyLoadout(dimStoreService.getActiveStore(), loadout, true);
      },
      getSetBucketsStep: function(activeGuardian) {
        var bestArmor = getBestArmor(buckets[activeGuardian], vendorBuckets[activeGuardian], vm.lockeditems, vm.excludeditems, vm.lockedperks);
        var helms = bestArmor.Helmet || [];
        var gaunts = bestArmor.Gauntlets || [];
        var chests = bestArmor.Chest || [];
        var legs = bestArmor.Leg || [];
        var classItems = bestArmor.ClassItem || [];
        var ghosts = bestArmor.Ghost || [];
        var artifacts = bestArmor.Artifact || [];
        var setMap = {};
        var set;
        var tiersSet = new Set();
        var combos = (helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length);
        if (combos === 0) {
          return null;
        }

        vm.hasSets = false;

        function step(activeGuardian, h, g, c, l, ci, gh, ar, processedCount) {
          for (; h < helms.length; ++h) {
            for (; g < gaunts.length; ++g) {
              for (; c < chests.length; ++c) {
                for (; l < legs.length; ++l) {
                  for (; ci < classItems.length; ++ci) {
                    for (; gh < ghosts.length; ++gh) {
                      for (; ar < artifacts.length; ++ar) {
                        set = {
                          armor: {
                            Helmet: helms[h],
                            Gauntlets: gaunts[g],
                            Chest: chests[c],
                            Leg: legs[l],
                            ClassItem: classItems[ci],
                            Artifact: artifacts[ar],
                            Ghost: ghosts[gh]
                          },
                          stats: {
                            STAT_INTELLECT: {
                              value: 0,
                              tier: 0,
                              name: 'Intellect',
                              icon: require('app/images/intellect.png'),
                            },
                            STAT_DISCIPLINE: {
                              value: 0,
                              tier: 0,
                              name: 'Discipline',
                              icon: require('app/images/discipline.png'),
                            },
                            STAT_STRENGTH: {
                              value: 0,
                              tier: 0,
                              name: 'Strength',
                              icon: require('app/images/strength.png'),
                            }
                          },
                          setHash: 0
                        };

                        if (validSet(set.armor)) {
                          vm.hasSets = true;
                          set.setHash = genSetHash(set.armor);
                          calcArmorStats(set);
                          var tiersString = set.stats.STAT_INTELLECT.tier +
                              '/' + set.stats.STAT_DISCIPLINE.tier +
                              '/' + set.stats.STAT_STRENGTH.tier;

                          tiersSet.add(tiersString);

                          // Build a map of all sets but only keep one copy of armor
                          // so we reduce memory usage
                          if (setMap[set.setHash]) {
                            if (setMap[set.setHash].tiers[tiersString]) {
                              setMap[set.setHash].tiers[tiersString].configs.push(getBonusConfig(set.armor));
                            } else {
                              setMap[set.setHash].tiers[tiersString] = { stats: set.stats, configs: [getBonusConfig(set.armor)] };
                            }
                          } else {
                            setMap[set.setHash] = { set: set, tiers: {} };
                            setMap[set.setHash].tiers[tiersString] = { stats: set.stats, configs: [getBonusConfig(set.armor)] };
                          }
                        }

                        processedCount++;
                        if (processedCount % 50000 === 0) { // do this so the page doesn't lock up
                          if (vm.active !== activeGuardian || vm.lockedchanged || vm.excludedchanged || vm.perkschanged || $location.path() !== '/best') {
                            // If active guardian or page is changed then stop processing combinations
                            vm.lockedchanged = false;
                            vm.excludedchanged = false;
                            vm.perkschanged = false;
                            return;
                          }
                          vm.progress = processedCount / combos;
                          $timeout(step, 0, true, activeGuardian, h, g, c, l, ci, gh, ar, processedCount);
                          return;
                        }
                      } ar = 0; } gh = 0; } ci = 0; } l = 0; } c = 0; } g = 0; }

          var tiers = _.each(_.groupBy(Array.from(tiersSet.keys()), function(tierString) {
            return _.reduce(tierString.split('/'), function(memo, num){
              return memo + parseInt(num, 10);
            }, 0);
          }), function(tier) {
            tier.sort().reverse();
          });

          vm.allSetTiers = [];
          var tierKeys = Object.keys(tiers);
          for (var t = tierKeys.length; t-- > tierKeys.length - 3;) {
            if (tierKeys[t]) {
              vm.allSetTiers.push('- Tier ' + tierKeys[t] + ' -');
              _.each(tiers[tierKeys[t]], function(set) {
                vm.allSetTiers.push(set);
              });
            }
          }

          vm.activesets = vm.allSetTiers[1];
          vm.activeHighestSets = getActiveHighestSets(setMap, vm.activesets);
          vm.collapsedConfigs = [false, false, false, false, false, false, false, false, false, false];

          // Finish progress
          vm.progress = processedCount / combos;
          console.log('processed', combos, 'combinations.');
        }
        vm.lockedchanged = false;
        vm.excludedchanged = false;
        vm.perkschanged = false;
        $timeout(step, 0, true, activeGuardian, 0, 0, 0, 0, 0, 0, 0, 0);
        return setMap;
      },
      getBonus: dimStoreService.getBonus,
      getStore: dimStoreService.getStore,
      getItems: function() {
        var stores = dimStoreService.getStores();

        if (stores.length === 0) {
          $state.go('inventory');
          return;
        }

        function filterPerks(perks, item) {
          // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
          var unwantedPerkHashes = [1270552711, 217480046, 191086989, 913963685, 1034209669, 1263323987, 193091484, 2133116599];
          return _.chain(perks.concat(item.talentGrid.nodes))
                  .uniq(function(node) { return node.hash; })
                  .reject(function(node) { return _.contains(unwantedPerkHashes, node.hash); })
                  .value();
        }

        function filterItems(items) {
          return _.filter(items, function(item) {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              item.talentGrid && item.talentGrid.nodes &&
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.stats;
          });
        }

        vm.selectedCharacter = dimStoreService.getActiveStore();
        vm.active = vm.selectedCharacter.class.toLowerCase() || 'warlock';
        vm.activeCharacters = _.reject(dimStoreService.getStores(), function(s) { return s.isVault; });
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, function(char) { return char.id === vm.selectedCharacter.id; });

        var allItems = [];
        var vendorItems = [];
        _.each(stores, function(store) {
          var items = filterItems(store.items);

          // Exclude felwinters if we have them
          var felwinters = _.filter(items, { hash: 2672107540 });
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniq(vm.excludeditems, 'id');
          }

          allItems = allItems.concat(items);

          // Build a map of perks
          _.each(items, function(item) {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], function(classType) {
                perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
              });
            } else {
              perks[item.classTypeName][item.type] = filterPerks(perks[item.classTypeName][item.type], item);
            }
          });
        });

        // Process vendors here
        _.each(dimVendorService.vendors, function(vendor) {
          var vendItems = filterItems(_.select(_.pluck(vendor.allItems, 'item'), (item) => item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'));
          vendorItems = vendorItems.concat(vendItems);

          // Exclude felwinters if we have them
          var felwinters = _.filter(vendorItems, { hash: 2672107540 });
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniq(vm.excludeditems, 'id');
          }

          // Build a map of perks
          _.each(vendItems, function(item) {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], function(classType) {
                vendorPerks[classType][item.type] = filterPerks(vendorPerks[classType][item.type], item);
              });
            } else {
              vendorPerks[item.classTypeName][item.type] = filterPerks(vendorPerks[item.classTypeName][item.type], item);
            }
          });
        });

        // Remove overlapping perks in allPerks from vendorPerks
        _.each(vendorPerks, function(perksWithType, classType) {
          _.each(perksWithType, function(perkArr, type) {
            vendorPerks[classType][type] = _.reject(perkArr, function(perk) { return _.contains(_.pluck(perks[classType][type], 'hash'), perk.hash); });
          });
        });

        function initBuckets() {
          function normalizeStats(item) {
            item.normalStats = {};
            _.each(item.stats, function(stat) {
              item.normalStats[stat.statHash] = {
                statHash: stat.statHash,
                base: stat.base,
                scaled: stat.scaled ? stat.scaled.min : 0,
                bonus: stat.bonus,
                split: stat.split,
                qualityPercentage: stat.qualityPercentage ? stat.qualityPercentage.min : 0
              };
            });
            return item;
          }
          function getBuckets(items) {
            return {
              Helmet: items.filter(function(item) {
                return item.type === 'Helmet';
              }).map(normalizeStats),
              Gauntlets: items.filter(function(item) {
                return item.type === 'Gauntlets';
              }).map(normalizeStats),
              Chest: items.filter(function(item) {
                return item.type === 'Chest';
              }).map(normalizeStats),
              Leg: items.filter(function(item) {
                return item.type === 'Leg';
              }).map(normalizeStats),
              ClassItem: items.filter(function(item) {
                return item.type === 'ClassItem';
              }).map(normalizeStats),
              Artifact: items.filter(function(item) {
                return item.type === 'Artifact';
              }).map(normalizeStats),
              Ghost: items.filter(function(item) {
                return item.type === 'Ghost';
              }).map(normalizeStats)
            };
          }
          function loadBucket(classType, useVendorItems = false) {
            var items = (useVendorItems) ? vendorItems : allItems;
            return getBuckets(items.filter(function(item) {
              return (item.classType === classType || item.classType === 3) && item.stats.length;
            }));
          }
          buckets = {
            titan: loadBucket(0),
            hunter: loadBucket(1),
            warlock: loadBucket(2)
          };

          vendorBuckets = {
            titan: loadBucket(0, true),
            hunter: loadBucket(1, true),
            warlock: loadBucket(2, true)
          };
        }

        initBuckets();  // Get items
        vm.onCharacterChange(); // Start processing
      }
    });

    // Entry point of builder this get stores and starts processing
    vm.getItems();
  });

  $rootScope.$on('dim-active-platform-updated', function() {
    vm.activePerks = {};
    vm.excludeditems = [];
    vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
    vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
    vm.getItems();
  });
}
