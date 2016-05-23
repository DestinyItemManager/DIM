(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $state, $q, loadingTracker, dimStoreService, dimItemService, ngDialog, dimLoadoutService) {
    var vm = this, buckets = [];
    
    function getBonusType(armorpiece) {
        var bonus_type = '';
        bonus_type += ((_.findWhere(armorpiece.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}).bonus > 0)? 'int' : '';
        bonus_type += ((_.findWhere(armorpiece.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}).bonus > 0)? 'disc' : '';
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
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); return  stats.scaled + stats.bonus;}), bonus_type: 'int'}, // best int_w_bonus
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'disc'}, // best dis_w_bonus
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'str'}, // best str_w_bonus
            ];
            // Best needs to include a non-exotic if the max is an exotic item
            best_non_exotic = [];
            for(var i = 0; i < best.length; ++i) {
                if(best[0].tier === 'Exotic') {
                    best_non_exotic.push({item: _.max(bucket[armortype], function(o){if (o.tier === 'Exotic') { return 0; } var stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); return  stats.scaled + stats.bonus;}), bonus_type: 'int'});
                }
            }
            best = best.concat(best_non_exotic);
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
      for(var index in gearset) {
          var item = gearset[index].item;
          if(item.tier === 'Exotic' && item.type != 'ClassItem') {
              exoticCount += 1;
          }
      }
      return exoticCount < 2;
    }

//    function doRankArmor(bucket, best) {
//      var armor = {};
//      for(var i in bucket) {
//        armor[i] = {
//          All: bucket[i]
////          Best: best[i],
////          Other: _.difference(bucket[i], best[i])
//        };
//      }
//      return armor;
//    }

    function getBuckets(items) {
      // load the best items
      return {
        helmet: items.filter(function(item) { return item.type === 'Helmet'; }),
        gauntlets: items.filter(function(item) { return item.type === 'Gauntlets'; }),
        chest: items.filter(function(item) { return item.type === 'Chest'; }),
        leg: items.filter(function(item) { return item.type === 'Leg'; }),
        classItem: items.filter(function(item) { return item.type === 'ClassItem'; }),
        ghost: items.filter(function(item) { return item.type === 'Ghost'; }),
        artifact: items.filter(function(item) { return item.type === 'Artifact'; })
      };
    }
    
    function getIterations(_class) {
      var iterations = [],
          exotics = 0,
          h = 0, hlen = _class.helmet.length,
          g = 0, glen = _class.gauntlets.length,
          c = 0, clen = _class.chest.length,
          l = 0, llen = _class.leg.length,
          ci = 0, cilen = _class.classItem.length,
          ar = 0, arlen = _class.artifact.length,
          gh = 0, ghlen = _class.ghost.length;
      var a = 0, s = 0;

      function exoticCheck(item, classItem) {
        exotics += item.tier === 'Exotic' ? 1 : 0;
        if(classItem && exotics > 2) {
          return true;
        } else if(exotics > 1) {
          exotics = 0;
          return true;
        }
      }

      for(h=0;h < hlen; h++) { if(exoticCheck(_class.helmet[h])) continue;
      for(g=0;g < glen; g++) { if(exoticCheck(_class.gauntlets[g])) continue;
      for(c=0;c < clen; c++) { if(exoticCheck(_class.chest[c])) continue;
      for(l=0;l < llen; l++) { if(exoticCheck(_class.leg[l])) continue;
      for(ci=0;ci < cilen; ci++) { if(exoticCheck(_class.classItem[ci], true)) continue;
      for(ar=0;ar < arlen; ar++) {
      for(gh=0;gh < ghlen; gh++) {

        var set = {
          armor: [
            _class.helmet[h],
            _class.gauntlets[g],
            _class.chest[c],
            _class.leg[l],
            _class.classItem[ci],
            _class.artifact[ar],
            _class.ghost[gh]
          ],
          stats: {
            STAT_INTELLECT: {value: 0},
            STAT_DISCIPLINE: {value: 0},
            STAT_STRENGTH: {value: 0}
          }
        };

        set.armor.forEach(function(armor) {
          armor.stats.forEach(function(stats) {
            switch(stats.statHash) {
              case 144602215: //int
                set.stats.STAT_INTELLECT.value += stats.value;
                break;
              case 1735777505: //dis
                set.stats.STAT_DISCIPLINE.value += stats.value;
                break;
              case 4244567218: //str
                set.stats.STAT_STRENGTH.value += stats.value;
                break;
            }
          });
        });

        set.stats = dimStoreService.getStatsData(set)
        iterations.push(set);
      }}}}}}}

      return iterations;
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
      topsets: [],
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
          var exoticCount = ((item.tier === 'Exotic')? 1 : 0);
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
        vm.topsets = vm.getTopSets(vm.highestsets[vm.activesets]);
      },
      onDrop: function(dropped_id, type) {
          dropped_id = dropped_id.split('-')[1];
          var item = _.findWhere(buckets[vm.active][type], {id: dropped_id});
          vm.lockeditems[type] = item;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems); 
          vm.highestsets = vm.getSetBucketsStep(vm.active, bestarmor);
      },
      onRemove: function(removed_type) {
          vm.lockeditems[removed_type] = null;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems); 
          vm.highestsets = vm.getSetBucketsStep(vm.active, bestarmor);
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
      newLoadout: function(index) {
        ngDialog.closeAll();
        var loadout = {};
        loadout.items = _.pick(vm.topsets[index].armor, 'helmet', 'chest', 'gauntlets', 'leg', 'classItem', 'ghost', 'artifact');
        loadout.items.helmet = [loadout.items.helmet.item];
        loadout.items.chest = [loadout.items.chest.item];
        loadout.items.gauntlets = [loadout.items.gauntlets.item];
        loadout.items.leg = [loadout.items.leg.item];
        loadout.items.classitem = [loadout.items.classItem.item];
        loadout.items.ghost = [loadout.items.ghost.item];
        loadout.items.artifact = [loadout.items.artifact.item];
        loadout.classType = vm.active2ind(vm.active);
        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout
        });
      },
      getTopSets: function(currsets) {
          return currsets.sort(function (a,b) {
                    var orders = vm.setOrder.split(',');   // e.g. int_val, disc_val, str_val
                    orders[0] = orders[0].substring(1);  
                    orders[1] = orders[1].substring(1);
                    orders[2] = orders[2].substring(1);
                    
                    if(a[orders[0]] < b[orders[0]]) { return 1; }
                    if(a[orders[0]] > b[orders[0]]) { return -1; }
                    if(a[orders[1]] < b[orders[1]]) { return 1; }
                    if(a[orders[1]] > b[orders[1]]) { return -1; }
                    if(a[orders[2]] < b[orders[2]]) { return 1; }
                    if(a[orders[2]] > b[orders[2]]) { return -1; }
                    
                    return 1;
                }).slice(0,20);
      },
      getSetBucketsStep: function(activeGaurdian, bestArmor) {
            var helms = bestArmor['helmet'];
            var gaunts = bestArmor['gauntlets'];
            var chests = bestArmor['chest'];
            var legs = bestArmor['leg'];
            var classItems = bestArmor['classItem'];
            var ghosts = bestArmor['ghost'];
            var artifacts = bestArmor['artifact'];
            
            var set_map = {};
            var load_stats = function(set, hash, target_type) {
                var total = 0;
                _.each(set.armor, function(armor) {
                    var stat = _.findWhere(armor.item.normalStats, {statHash: hash}) || {scaled: 0, bonus: 0};
                    total += stat.scaled + (armor.bonus_type == target_type ? stat.bonus : 0);
                });
                return total;
            };
            
            function step(activeGaurdian, h, g, c, l, ci, gh, ar, processed_count) {
                for(; h < helms.length; ++h) {
                for(; g < gaunts.length; ++g) {
                for(; c < chests.length; ++c) {
                for(; l < legs.length; ++l) {
                for(; ci < classItems.length; ++ci) {
                for(; gh < ghosts.length; ++gh) {
                for(; ar < artifacts.length; ++ar) {
                    var armor = {helmet: helms[h], gauntlets: gaunts[g], chest: chests[c], leg: legs[l], classItem: classItems[ci], ghost: ghosts[gh], artifact: artifacts[ar]};
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
                    if((processed_count%1000) == 0) {
                        // If active gaurdian is changed then stop processing combinations
                        if(vm.active != activeGaurdian) {
                            return;
                        }
                        $scope.$apply(function () {
                            vm.progress = processed_count/(helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length);
                        });
                        setTimeout(function() { step(activeGaurdian, h,g,c,l,ci,gh,ar,processed_count); },0);
                        return;
                    }
                } ar = 0; } gh = 0; } ci = 0; } l = 0; } c = 0; } g = 0; }
                
                vm.allSetTiers = Object.keys(set_map).sort().reverse();
                vm.activesets = vm.allSetTiers[0];
                
                // Finish progress
                $scope.$apply(function () {
                    vm.progress = processed_count/(helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length);
                });
                console.timeEnd('test');
                vm.topsets = vm.getTopSets(vm.highestsets[vm.activesets]);
            }
            console.time('test');
            setTimeout(function() { step(activeGaurdian, 0,0,0,0,0,0,0,0); },0);
            return set_map;
      },
      normalizeBuckets: function() {
        function normalizeStats(item, mod) {
          item.normalStats = _.map(item.stats, function(stat) {
            return {
              statHash: stat.statHash,
              base: (stat.base*(vm.doNormalize ? vm.normalize : item.primStat.value)/item.primStat.value).toFixed(0),
              scaled: stat.scaled,
              bonus: stat.bonus,
              split: stat.split,
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
          'Ghosts': _.flatten(buckets[vm.active].ghost.map(function(item) {
            return normalizeStats(item);
          }), true),
          'Artifacts': _.flatten(buckets[vm.active].artifact.map(function(item) {
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
      getColor: function(value) {
          var color = 0;
          if(value <= 85) {
            color = 0;
          } else if(value <= 90) {
            color = 20;
          } else if(value <= 95) {
            color = 60;
          } else if(value <= 99) {
            color = 120;
          } else if(value >= 100) {
            color = 190;
          } else {
            return 'white';
          }
          return 'hsl(' + color + ',85%,60%)';
//        value = value - 75 < 0 ? 0 : value - 75;
//        if(value === 0) {
//          return 'white';
//        }
//        return 'hsl(' + (value/30*120).toString(10) + ',55%,50%)';
      },
      getStore: function(id) {
        return dimStoreService.getStore(id);
      },
      // get Items for infusion
      getItems: function() {
//<<<<<<< Updated upstream
        var stores = dimStoreService.getStores();

        if(stores.length === 0) {
          $state.go('inventory');
          return;
        }

        var allItems = [];

        // all stores
        _.each(stores, function(store, id) {

          // all armor in store
          var items = _.filter(store.items, function(item) {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defence hash
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.tier === 'Exotic')) &&
              item.stats
          });

          allItems = allItems.concat(items);
//=======
//        dimStoreService.getStores(false, true).then(function(stores) {
//          var allItems = [];
//
//          // all stores
//          _.each(stores, function(store, id, list) {
//
//            // all armor in store
//            var items = _.filter(store.items, function(item) {
//              return item.primStat &&
//                item.primStat.statHash === 3897883278 && // has defence hash
//                ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.tier === 'Exotic')) &&
//                (vm.showYear1 && item.year > 1) &&
//                item.stats
//            });
//
//            allItems = allItems.concat(items);
//          });
//
//
////          console.time('derp')
////          console.log(getCombinations(allItems.filter(function(item) { return item.classType === 2 || item.classType === 3; })).length);
////          console.timeEnd('derp')
//          buckets = initBuckets(allItems);
//console.time('elapsed');
//          var bestArmor = getBestArmor(buckets.titan);
//
//          vm.ranked = doRankArmor(buckets.titan, bestArmor);
////          vm.combinations = getIterations(buckets.titan);
//          vm.combinations = getIterations(bestArmor);
//console.timeEnd('elapsed');
//          console.log(vm.combinations.length)
//>>>>>>> Stashed changes
        });

        buckets = initBuckets(allItems);
        vm.normalizeBuckets();

        //playground:

//          console.log(buckets)
//          console.log(bestArmor)
//          var warlock = normalizeBuckets(buckets.warlock, 320);
//          console.log('done')
//console.time('elapsed');
//          var bestArmor = getBestArmor(warlock);
//
//          vm.ranked = doRankArmor(warlock, bestArmor);
////          vm.combinations = getIterations(buckets.titan);
////          vm.combinations = getIterations(bestArmor);
//console.timeEnd('elapsed');
////          console.log(vm.combinations.length)
      }
    });

    vm.getItems();
  }
})();
