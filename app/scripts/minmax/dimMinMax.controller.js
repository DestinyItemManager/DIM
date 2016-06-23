(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', '$timeout', '$location', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $state, $q, $timeout, $location, loadingTracker, dimStoreService, dimItemService, ngDialog, dimLoadoutService) {
    var vm = this, buckets = [];

    function getBonusType(armorpiece) {
      var bonus_type = '';
      bonus_type += armorpiece.normalStats[144602215].bonus > 0? 'int ' : '';
      bonus_type += armorpiece.normalStats[1735777505].bonus > 0? 'disc ' : '';
      bonus_type += armorpiece.normalStats[4244567218].bonus > 0? 'str' : '';
      return bonus_type;
    }

    function getBestArmor(bucket, locked) {
      var armor = {};
      var best = [], best_non_exotic = [];
      for (var armortype in bucket) {
        if(locked[armortype] !== null) {
          best = [{item: locked[armortype], bonus_type: getBonusType(locked[armortype])}];
        } else {
          best = [
            {item: _.max(bucket[armortype], function(o){
              var int_stats = o.normalStats[144602215];
              var disc_stats = o.normalStats[1735777505];
              return int_stats[vm.scale_type] + int_stats.bonus + disc_stats[vm.scale_type];
            }), bonus_type: 'intdisc'
            }, // best int + bonus + dis
            {item: _.max(bucket[armortype], function(o){
              var int_stats = o.normalStats[144602215];
              var str_stats = o.normalStats[4244567218];
              return int_stats[vm.scale_type] + int_stats.bonus + str_stats[vm.scale_type];
            }), bonus_type: 'intstr'
            }, // best int + bonus + str
            {item: _.max(bucket[armortype], function(o){
              var disc_stats = o.normalStats[1735777505];
              var str_stats = o.normalStats[1735777505];
              return disc_stats[vm.scale_type] + str_stats[vm.scale_type] + str_stats.bonus;
            }), bonus_type: 'discstr'
            }, // best dis + bonus + str
          ];
          if(vm.mode) {
            best = best.concat([
              {item: _.max(bucket[armortype], function(o){
                var stats = o.normalStats[144602215];
                return  stats[vm.scale_type] + stats.bonus;}), bonus_type: 'int'}, // best int_w_bonus
              {item: _.max(bucket[armortype], function(o){
                var stats = o.normalStats[1735777505];
                return stats[vm.scale_type] + stats.bonus;}), bonus_type: 'disc'}, // best dis_w_bonus
              {item: _.max(bucket[armortype], function(o){
                var stats = o.normalStats[4244567218];
                return stats[vm.scale_type] + stats.bonus;}), bonus_type: 'str'}, // best str_w_bonus
            ]);
          }

          if(armortype.toLowerCase() !== 'classitem') {
            // Best needs to include a non-exotic if the max is an exotic item
            best_non_exotic = [];
            var i = 0;
            if(best[i++].item.tier === 'Exotic') {
                best_non_exotic.push({item: _.max(bucket[armortype], function(o){
                  if (o.tier === 'Exotic') { return 0; }
                  var int_stats = o.normalStats[144602215];
                  var disc_stats = o.normalStats[1735777505];
                  return int_stats[vm.scale_type] + int_stats.bonus + disc_stats[vm.scale_type]; }), bonus_type: ''});
            }
            if(best[i++].item.tier === 'Exotic') {
                best_non_exotic.push({item: _.max(bucket[armortype], function(o){
                  if (o.tier === 'Exotic') { return 0; }
                  var int_stats = o.normalStats[144602215];
                  var str_stats = o.normalStats[4244567218];
                  return int_stats[vm.scale_type] + int_stats.bonus + str_stats[vm.scale_type]; }), bonus_type: ''});
            }
            if(best[i++].item.tier === 'Exotic') {
                best_non_exotic.push({item: _.max(bucket[armortype], function(o){
                  if (o.tier === 'Exotic') { return 0; }
                  var disc_stats = o.normalStats[1735777505];
                  var str_stats = o.normalStats[4244567218];
                  return disc_stats[vm.scale_type] + disc_stats.bonus + str_stats[vm.scale_type]; }), bonus_type: ''});
            }
            if(vm.mode) {
              var stat_hashes = [144602215, 1735777505, 4244567218];
              for(; i < 6; ++i) {
                if(best[i].item.tier === 'Exotic') {
                  var hash = stat_hashes[i-3];
                  best_non_exotic.push({
                    item: _.max(bucket[armortype], function(o){
                      if (o.tier === 'Exotic') { return 0; }
                      var stats = o.normalStats[hash];
                      return stats[vm.scale_type] + stats.bonus;
                    }),
                    bonus_type: ''
                  });
                }
              }
            }
            best = best.concat(best_non_exotic);
          }
        }

        var unique_objs = _.uniq(best, false, function(o) { return o.item.index; });
        var best_combs = [];

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
      return ((gearset.Helmet.item.tier === 'Exotic') +
      (gearset.Gauntlets.item.tier === 'Exotic') +
      (gearset.Chest.item.tier === 'Exotic') +
      (gearset.Leg.item.tier === 'Exotic')) < 2;
    }

    function getBuckets(items) {
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

      // load the best items
      return {
        Helmet: items.filter(function(item) { return item.type === 'Helmet'; }).map(normalizeStats),
        Gauntlets: items.filter(function(item) { return item.type === 'Gauntlets'; }).map(normalizeStats),
        Chest: items.filter(function(item) { return item.type === 'Chest'; }).map(normalizeStats),
        Leg: items.filter(function(item) { return item.type === 'Leg'; }).map(normalizeStats),
        ClassItem: items.filter(function(item) { return item.type === 'ClassItem'; }).map(normalizeStats),
        Ghost: items.filter(function(item) { return item.type === 'Ghost'; }).map(normalizeStats),
        Artifact: items.filter(function(item) { return item.type === 'Artifact'; }).map(normalizeStats)
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
      mode: false,
      scale_type: 'scaled',
      allSetTiers: [],
      highestsets: {},
      lockeditems: { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null },
      normalize: 335,
      type: 'Helmet',
      showBlues: false,
      showExotics: true,
      showYear1: false,
      combinations: null,
      setOrder: '-str_val,-disc_val,-int_val',
      setOrderValues: ['-str_val', '-disc_val', '-int_val'],
      statOrder: '-stats.STAT_INTELLECT.value',
      ranked: {},
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
      onCharacterChange: function() {
        vm.ranked = buckets[vm.active];
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.highestsets = vm.getSetBucketsStep(vm.active, vm.mode);
      },
      onModeChange: function () {
        if(vm.progress <= 1) {
          vm.highestsets = vm.getSetBucketsStep(vm.active, vm.mode);
        }
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
        vm.highestsets = vm.getSetBucketsStep(vm.active, vm.mode);
        if(vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      onRemove: function(removed_type) {
        vm.lockeditems[removed_type] = null;

        vm.highestsets = vm.getSetBucketsStep(vm.active, vm.mode);
        if(vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      newLoadout: function(set) {
        ngDialog.closeAll();
        var loadout = { items: {} };
        var items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        loadout.items.helmet = [items.Helmet.item];
        loadout.items.chest = [items.Chest.item];
        loadout.items.gauntlets = [items.Gauntlets.item];
        loadout.items.leg = [items.Leg.item];
        loadout.items.classitem = [items.ClassItem.item];
        loadout.items.ghost = [items.Ghost.item];
        loadout.items.artifact = [items.Artifact.item];
        loadout.classType = ({'warlock': 0, 'titan': 1, 'hunter': 2})[vm.active];

        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout,
          equipAll: true
        });
      },
      getSetBucketsStep: function(activeGaurdian, mode) {
        var bestArmor = getBestArmor(buckets[activeGaurdian], vm.lockeditems);
        var helms = bestArmor['Helmet'] || [];
        var gaunts = bestArmor['Gauntlets'] || [];
        var chests = bestArmor['Chest'] || [];
        var legs = bestArmor['Leg'] || [];
        var classItems = bestArmor['ClassItem'] || [];
        var ghosts = bestArmor['Ghost'] || [];
        var artifacts = bestArmor['Artifact'] || [];

        if(helms.length == 0 || gaunts.length == 0 || chests.length == 0 ||
           legs.length == 0 || classItems.length == 0 || ghosts.length == 0 || artifacts.length == 0) {
          return null;
        }

        var set_map = {}, int, dis, str, set;
        var combos = (helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length) || 1;

        function step(activeGaurdian, mode, h, g, c, l, ci, gh, ar, processed_count) {
          for(; h < helms.length; ++h) {
            for(; g < gaunts.length; ++g) {
              for(; c < chests.length; ++c) {
                for(; l < legs.length; ++l) {
                  for(; ci < classItems.length; ++ci) {
                    for(; gh < ghosts.length; ++gh) {
                      for(; ar < artifacts.length; ++ar) {
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
                              name: 'Intellect'
                            },
                            STAT_DISCIPLINE: {
                              value: 0,
                              name: 'Discipline'
                            },
                            STAT_STRENGTH: {
                              value: 0,
                              name: 'Strength'
                            }
                          },
                          int_val: 0,
                          disc_val: 0,
                          str_val: 0
                        };
                        if(validSet(set.armor)) {
                          _.each(set.armor, function(armor) {
                            int = armor.item.normalStats[144602215];
                            dis = armor.item.normalStats[1735777505];
                            str = armor.item.normalStats[4244567218];

                            set.stats.STAT_INTELLECT.value += int[vm.scale_type];
                            set.stats.STAT_DISCIPLINE.value += dis[vm.scale_type];
                            set.stats.STAT_STRENGTH.value += str[vm.scale_type];

                            switch(armor.bonus_type) {
                              case 'int': set.stats.STAT_INTELLECT.value += int.bonus; break;
                              case 'disc': set.stats.STAT_DISCIPLINE.value += dis.bonus; break;
                              case 'str': set.stats.STAT_STRENGTH.value += str.bonus; break;
                            }
                          });

                          var int_level = Math.min(Math.floor(set.stats.STAT_INTELLECT.value/60), 5);
                          var disc_level = Math.min(Math.floor(set.stats.STAT_DISCIPLINE.value/60), 5);
                          var str_level = Math.min(Math.floor(set.stats.STAT_STRENGTH.value/60), 5);
                          var tiers_string = int_level + '/' + disc_level + '/' + str_level;
                          if(set_map[tiers_string]) {
                            set_map[tiers_string].push(set);
                          } else {
                            set_map[tiers_string] = [set];
                          }
                        }

                        processed_count++;
                        if(vm.mode) {
                          if(processed_count % 20000 === 0) {
                            // If active gaurdian or page is changed then stop processing combinations
                            if(vm.active !== activeGaurdian || vm.mode !== mode ||  vm.lockedchanged || $location.path() !== '/best') {
                              vm.lockedchanged = false;
                              return;
                            }
                            vm.progress = processed_count/combos;
                            $timeout(step, 0, true, activeGaurdian, mode, h,g,c,l,ci,gh,ar,processed_count);
                            return;
                          }
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
          console.log('processed', combos, 'combinations.');
          console.timeEnd('elapsed');
          if(vm.mode) {
            $scope.$apply();
          }
        }
        console.time('elapsed');
        vm.lockedchanged = false;
        if(vm.mode) {
          $timeout(step, 0, false, activeGaurdian, mode, 0,0,0,0,0,0,0,0);
        } else {
          // do 'instant'... but page freeze
          step(activeGaurdian, mode, 0,0,0,0,0,0,0,0);
        }
        return set_map;
      },
      getBonus: dimStoreService.getBonus,
      getStore: dimStoreService.getStore,
      // get Items for infusion
      getItems: function() {
        var stores = dimStoreService.getStores();

        if(stores.length === 0) {
          $state.go('inventory');
          return;
        }

        var allItems = [];
        vm.active = _.sortBy(stores, 'lastPlayed').reverse()[0].class.toLowerCase() || 'warlock';

        // all stores
        _.each(stores, function(store, id) {

          // all armor in store
          var items = _.filter(store.items, function(item) {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defence hash
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.tier === 'Exotic')) &&
              item.primStat.value >= 280 && // only 280+ light items
              item.stats;
          });

          allItems = allItems.concat(items);
        });

        buckets = initBuckets(allItems);

        vm.onCharacterChange();
      }
    });

    vm.getItems();
  }
})();
