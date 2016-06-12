(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', '$timeout', '$location', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $state, $q, $timeout, $location, loadingTracker, dimStoreService, dimItemService, ngDialog, dimLoadoutService) {
    var vm = this, buckets = [];

    function getBonusType(armorpiece) {
        var bonus_type = '';
        bonus_type += ((_.findWhere(armorpiece.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}).bonus > 0)? 'int ' : '';
        bonus_type += ((_.findWhere(armorpiece.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}).bonus > 0)? 'disc ' : '';
        bonus_type += ((_.findWhere(armorpiece.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}).bonus > 0)? 'str' : '';
        return bonus_type;
    }

    function getBestArmor(bucket, locked) {
      var armor = {};
      var best = [], best_non_exotic = [];
      for(var armortype in bucket) {
        if(armortype.toLowerCase() === 'classitem' && locked.classItem !== null) {
            best = [{item: locked.classItem, bonus_type: getBonusType(locked.classItem) }];
        } else if(armortype.toLowerCase() !== 'classitem' && locked[armortype.toLowerCase()] !== null) {
            best = [{item: locked[armortype.toLowerCase()], bonus_type: getBonusType(locked[armortype.toLowerCase()])}];
        } else {
            best = [
            //{item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); return  stats.scaled + stats.bonus;}), bonus_type: 'int'}, // best int_w_bonus
            //{item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'disc'}, // best dis_w_bonus
            //{item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'str'}, // best str_w_bonus
              {item: _.max(bucket[armortype], function(o){
                var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0});
                var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0});
                return int_stats.scaled + int_stats.bonus + disc_stats.scaled; }), bonus_type: 'intdisc'
              }, // best int + bonus + dis
              {item: _.max(bucket[armortype], function(o){
                var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0});
                var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0});
                return int_stats.scaled + int_stats.bonus + str_stats.scaled; }), bonus_type: 'intstr'
              }, // best int + bonus + str
              {item: _.max(bucket[armortype], function(o){
                var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0});
                var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0});
                return disc_stats.scaled + str_stats.scaled + str_stats.bonus; }), bonus_type: 'discstr'
              }, // best dis + bonus + str
            ];
            if(armortype.toLowerCase() !== 'classitem') {
                // Best needs to include a non-exotic if the max is an exotic item
                best_non_exotic = [];
                //var stat_hashes = [144602215, 1735777505, 4244567218];
                //for(var i = 0; i < 3; ++i) {
                //    if(best[i].item.tier === 'Exotic') {
                //        var hash = stat_hashes[i];
                //        best_non_exotic.push({item: _.max(bucket[armortype], function(o){if (o.tier === 'Exotic') { return 0; } var stats = (_.findWhere(o.normalStats, {statHash: hash}) || {scaled: 0, bonus: 0}); return  stats.scaled + stats.bonus;}), bonus_type: ''});
                //    }
                //}
                if(best[0].item.tier === 'Exotic') {
                    best_non_exotic.push({item: _.max(bucket[armortype], function(o){ if (o.tier === 'Exotic') { return 0; } var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); return int_stats.scaled + int_stats.bonus + disc_stats.scaled; }), bonus_type: ''});
                }
                if(best[1].item.tier === 'Exotic') {
                    best_non_exotic.push({item: _.max(bucket[armortype], function(o){ if (o.tier === 'Exotic') { return 0; } var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}); return int_stats.scaled + int_stats.bonus + str_stats.scaled; }), bonus_type: ''});
                }
                if(best[2].item.tier === 'Exotic') {
                    best_non_exotic.push({item: _.max(bucket[armortype], function(o){ if (o.tier === 'Exotic') { return 0; } var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}); return disc_stats.scaled + disc_stats.bonus + str_stats.scaled; }), bonus_type: ''});
                }
                best = best.concat(best_non_exotic);
            }
        }

        var unique_objs = _.uniq(best, false, function(o) { return o.item.index; });
        var best_combs = []
        for(var index in unique_objs) {
            var obj = unique_objs[index];
            obj.bonus_type = getBonusType(obj.item);
            if(obj.bonus_type.indexOf('int') > -1) {
                best_combs.push({item: obj.item, bonus_type: 'int'});
            }
            if (obj.bonus_type.indexOf('disc') > -1) {
                best_combs.push({item: obj.item, bonus_type: 'disc'});
            }
            if (obj.bonus_type.indexOf('str') > -1) {
                best_combs.push({item: obj.item, bonus_type: 'str'});
            }
        }
        armor[armortype] = best_combs;
      }
      return armor;
    }

    function validSet(gearset) {
      var exoticCount = 0;
      exoticCount += ((gearset.helmet.item.tier === 'Exotic')? 1 : 0);
      exoticCount += ((gearset.gauntlets.item.tier === 'Exotic')? 1 : 0);
      exoticCount += ((gearset.chest.item.tier === 'Exotic')? 1 : 0);
      exoticCount += ((gearset.leg.item.tier === 'Exotic')? 1 : 0);
      return exoticCount < 2;
    }

    function getBuckets(items) {
      // load the best items
      return {
        helmet: items.filter(function(item) { return item.type === 'Helmet'; }),
        gauntlets: items.filter(function(item) { return item.type === 'Gauntlets'; }),
        chest: items.filter(function(item) { return item.type === 'Chest'; }),
        leg: items.filter(function(item) { return item.type === 'Leg'; }),
        classItem: items.filter(function(item) { return item.type === 'ClassItem'; }),
        artifact: items.filter(function(item) { return item.type === 'Artifact'; }),
        ghost: items.filter(function(item) { return item.type === 'Ghost'; })
      };
    }

    function initBuckets(items) {
      return {
        titan: getBuckets(items.filter(function(item) { return item.classType === 0 || item.classType === 3; })),
        hunter: getBuckets(items.filter(function(item) { return item.classType === 1 || item.classType === 3; })),
        warlock: getBuckets(items.filter(function(item) { return item.classType === 2 || item.classType === 3; }))
      };
    }

    angular.extend(vm, {
      active: 'warlock',
      activesets: '5/5/1',
      progress: 0,
      allSetTiers: [],
      highestsets: {},
      lockeditems: { helmet: null, gauntlets: null, chest: null, leg: null, classItem: null, ghost: null, artifact: null },
      normalize: 335,
      doNormalize: false,
      type: 'Helmets',
      showBlues: false,
      showExotics: true,
      showYear1: false,
      combinations: null,
      setOrder: '-str_val,-disc_val,-int_val',
      setOrderValues: ['-str_val', '-disc_val', '-int_val'],
      statOrder: '-stats.STAT_INTELLECT.value',
      ranked: {},
      filter: {
        int: 3,
        dis: 2,
        str: 2
      },
      lockedItemsValid: function(dropped_id, dropped_type) {
          dropped_id = dropped_id.split('-')[1];
          var item = _.findWhere(buckets[vm.active][dropped_type], {id: dropped_id});
          var exoticCount = ((item.tier === 'Exotic' && item.type != 'ClassItem')? 1 : 0);
          for(var type in vm.lockeditems) {
              var item = vm.lockeditems[type];
              if(item === null || type === dropped_type) { continue; }
              if(item.tier === 'Exotic' && item.type != 'ClassItem') {
                  exoticCount += 1;
              }
          }
          return exoticCount < 2;
      },
      onOrderChange: function () {
        vm.setOrderValues = vm.setOrder.split(',');
      },
      onDrop: function(dropped_id, type) {
          dropped_id = dropped_id.split('-')[1];
          if(vm.lockeditems[type] && vm.lockeditems[type].id == dropped_id) {
            return;
          }
          var item = _.findWhere(buckets[vm.active][type], {id: dropped_id});
          vm.lockeditems[type] = item;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
          vm.highestsets = vm.getSetBucketsStep(vm.active, bestarmor);
          if(vm.progress < 1.0) {
            vm.lockedchanged = true;
          }
      },
      onRemove: function(removed_type) {
          vm.lockeditems[removed_type] = null;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
          vm.highestsets = vm.getSetBucketsStep(vm.active, bestarmor);
          if(vm.progress < 1.0) {
            vm.lockedchanged = true;
          }
      },
      active2ind: function(activeStr) {
          if(activeStr.toLowerCase() === 'warlock') {
              return 0;
          } else if(activeStr.toLowerCase() === 'titan') {
              return 1;
          } else if(activeStr.toLowerCase() === 'hunter') {
              return 2;
          } else {
              return -1;
          }
      },
      newLoadout: function(set) {
        ngDialog.closeAll();
        var loadout = {};
        loadout.items = _.pick(set.armor, 'helmet', 'chest', 'gauntlets', 'leg', 'classItem', 'ghost', 'artifact');
        loadout.items.helmet = [loadout.items.helmet.item];
        loadout.items.chest = [loadout.items.chest.item];
        loadout.items.gauntlets = [loadout.items.gauntlets.item];
        loadout.items.leg = [loadout.items.leg.item];
        loadout.items.classitem = [loadout.items.classItem.item];
        loadout.items.ghost = [loadout.items.ghost.item];
        loadout.items.artifact = [loadout.items.artifact.item];
        loadout.classType = vm.active2ind(vm.active);

        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout,
          equipAll: true
        });
      },
      getSetBucketsStep: function(activeGaurdian, bestArmor) {
            var helms = bestArmor['helmet'] || [];
            var gaunts = bestArmor['gauntlets'] || [];
            var chests = bestArmor['chest'] || [];
            var legs = bestArmor['leg'] || [];
            var classItems = bestArmor['classItem'] || [];
            var ghosts = bestArmor['ghost'] || [];
            var artifacts = bestArmor['artifact'] || [];

            if(helms.length == 0 || gaunts.length == 0 || chests.length == 0 ||
                legs.length == 0 || classItems.length == 0 || ghosts.length == 0 || artifacts.length == 0) {
                return null;
            }

            var set_map = {};
            var load_stats = function(set, hash, target_type) {
                var total = 0;
                _.each(set.armor, function(armor) {
                    var stat = _.findWhere(armor.item.normalStats, {statHash: hash}) || {scaled: 0, bonus: 0};
                    total += stat.scaled + (armor.bonus_type == target_type ? stat.bonus : 0);
                });
                return total;
            };

            var combos = (helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length) || 1;

            function step(activeGaurdian, h, g, c, l, ci, gh, ar, processed_count) {
                for(; h < helms.length; ++h) {
                for(; g < gaunts.length; ++g) {
                for(; c < chests.length; ++c) {
                for(; l < legs.length; ++l) {
                for(; ci < classItems.length; ++ci) {
                for(; gh < ghosts.length; ++gh) {
                for(; ar < artifacts.length; ++ar) {
                    var armor = {helmet: helms[h], gauntlets: gaunts[g], chest: chests[c], leg: legs[l], classItem: classItems[ci], artifact: artifacts[ar], ghost: ghosts[gh]};
                    if(validSet(armor)) {
                        var set = {armor: armor};
                        set.int_val = load_stats(set, 144602215, 'int');
                        set.disc_val = load_stats(set, 1735777505, 'disc');
                        set.str_val = load_stats(set, 4244567218, 'str');
                        var int_level = Math.min(Math.floor(set.int_val/60), 5);
                        var disc_level = Math.min(Math.floor(set.disc_val/60), 5);
                        var str_level = Math.min(Math.floor(set.str_val/60), 5);
                        var tiers_string = int_level.toString() + '/' + disc_level.toString() + '/' + str_level.toString();
                        if(tiers_string in set_map) {
                            set_map[tiers_string].push(set);
                        } else {
                            set_map[tiers_string] = [set];
                        }
                    }

                    processed_count++;
                    if((processed_count%5000) == 0) {
                        // If active gaurdian or page is changed then stop processing combinations
                        if(vm.active !== activeGaurdian || vm.lockedchanged || $location.path() !== '/best') {
                            vm.lockedchanged = false;
                            return;
                        }
                        vm.progress = processed_count/combos;
                        $timeout(step, 0, true, activeGaurdian, h,g,c,l,ci,gh,ar,processed_count);
                        return;
                    }
                } ar = 0; } gh = 0; } ci = 0; } l = 0; } c = 0; } g = 0; }

                var tiers = _.each(_.groupBy(Object.keys(set_map), function(set) {
                    return _.reduce(set.split('/'), function(memo, num){
                        return memo + parseInt(num); }, 0);;
                }), function(tier) {
                    tier.sort().reverse();
                });

                vm.allSetTiers = [];
                var tier_keys = Object.keys(tiers);
                for (var t = tier_keys.length; t-- > tier_keys.length - 3; ) {
                    vm.allSetTiers.push('- Tier ' + tier_keys[t] + ' -');
                    _.each(tiers[tier_keys[t]], function(set) {
                        vm.allSetTiers.push(set);
                    });
                }

                vm.activesets = vm.allSetTiers[1];

                // Finish progress
                vm.progress = processed_count/combos;
                console.timeEnd('elapsed');
            }
            console.time('elapsed');
            vm.lockedchanged = false;
            $timeout(step, 0, true, activeGaurdian, 0,0,0,0,0,0,0,0);
            return set_map;
      },
      normalizeBuckets: function() {
        function normalizeStats(item, mod) {
          item.normalStats = _.map(item.stats, function(stat) {
            return {
              statHash: stat.statHash,
              base: (stat.base*(vm.doNormalize ? vm.normalize : item.primStat.value)/item.primStat.value).toFixed(0),
              scaled: stat.scaled ? stat.scaled.min : 0,
              bonus: stat.bonus,
              split: stat.split,
              qualityPercentage: stat.qualityPercentage ? stat.qualityPercentage.min : 0
            };
          });
          return item;
        }

        // from https://github.com/CVSPPF/Destiny/blob/master/DestinyArmor.py#L14
        var normalized = {
          'Helmets': _.flatten(buckets[vm.active].helmet.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Gauntlets': _.flatten(buckets[vm.active].gauntlets.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Chest Armor': _.flatten(buckets[vm.active].chest.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Leg Armor': _.flatten(buckets[vm.active].leg.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Class Items': _.flatten(buckets[vm.active].classItem.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Artifacts': _.flatten(buckets[vm.active].artifact.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Ghosts': _.flatten(buckets[vm.active].ghost.map(function(item) {
            return normalizeStats(item);
          }), true)
        };

        vm.ranked = normalized;//doRankArmor(normalized, getBestArmor(normalized));

        vm.lockeditems.helmet = vm.lockeditems.gauntlets = vm.lockeditems.chest = null;
        vm.lockeditems.leg = vm.lockeditems.classItem = vm.lockeditems.ghost = vm.lockeditems.artifact = null;
        var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
        vm.highestsets = vm.getSetBucketsStep(vm.active, bestarmor);
      },
      filterFunction: function(element) {
        return element.stats.STAT_INTELLECT.tier >= vm.filter.int && element.stats.STAT_DISCIPLINE.tier >= vm.filter.dis && element.stats.STAT_STRENGTH.tier >= vm.filter.str;
      },
      getBonus: dimStoreService.getBonus,
      getStore: function(id) {
        return dimStoreService.getStore(id);
      },
      // get Items for infusion
      getItems: function() {
        var stores = dimStoreService.getStores();

        if(stores.length === 0) {
          $state.go('inventory');
          return;
        }

        var lastActive = '';
        var lastActiveChar = '';
        var allItems = [];

        // all stores
        _.each(stores, function(store, id) {

          // all armor in store
          var items = _.filter(store.items, function(item) {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defence hash
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.tier === 'Exotic')) &&
              item.primStat.value >= 280 // only 280+ light items
              item.stats
          });
          
          if(store.class !== 'vault') {
              if(lastActive === '') {
                lastActive = store.lastPlayed;
                lastActiveChar = store.class;
              } else {
                var d = new Date(store.lastPlayed);
                if(d > new Date(lastActive)) {
                    lastActive = store.lastPlayed;
                    lastActiveChar = store.class;
                }
              }
          }

          allItems = allItems.concat(items);
        });

        vm.active = lastActiveChar.toLowerCase() || 'warlock';
        buckets = initBuckets(allItems);
        vm.normalizeBuckets();
      }
    });

    vm.getItems();
  }
})();
