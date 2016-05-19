(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $state, $q, loadingTracker, dimStoreService, dimItemService, ngDialog, dimLoadoutService) {
    var vm = this, buckets = [];

//    function getBestArmor(bucket) {
//      var armor = {};
//      for(var i in bucket) {
//        var best = [
////          _.max(bucket[i], function(o){return  (_.findWhere(o.normalStats, {statHash: 144602215}) || {base: 0}).base;}), // best intellect
////          _.max(bucket[i], function(o){return (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}).base;}), // best discipline
////          _.max(bucket[i], function(o){return (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}).base;}), // best strength
//          _.max(bucket[i], function(o){return  (_.findWhere(o.normalStats, {statHash: 144602215}) || {base: 0}).base + (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}).base;}), // best int + dis
//          _.max(bucket[i], function(o){return  (_.findWhere(o.normalStats, {statHash: 144602215}) || {base: 0}).base + (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}).base;}), // best int + str
//          _.max(bucket[i], function(o){return (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}).base + (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}).base;}) // best dis + str
//        ];
//        armor[i] = _.uniq(best);
//      }
//      return armor;
//    }
//
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

//    var slice = Array.prototype.slice;
//    function combinations() {
//      return _.reduce(slice.call(arguments, 1),function(ret,newarr){
//        return _.reduce(ret,function(memo,oldi){
//          return memo.concat(_.map(newarr,function(newi){
//            return oldi.concat([newi]);
//          }));
//        },[]);
//      },_.map(arguments[0],function(i){return [i];}));
//    }
//
//    function getCombinations(items) {
//      console.log(items.filter(function(item) { return item.bucket === 3448274439; }))
//      // load the best items
//      return combinations(
//        items.filter(function(item) { return item.bucket === 3448274439; }),
//        items.filter(function(item) { return item.bucket === 3551918588; }),
//        items.filter(function(item) { return item.bucket === 14239492; }),
//        items.filter(function(item) { return item.bucket === 20886954; }),
//        items.filter(function(item) { return item.bucket === 1585787867; }),
//        items.filter(function(item) { return item.bucket === 4023194814; }),
//        items.filter(function(item) { return item.bucket === 434908299; })
//      );
//    }




//    combinations: function(){
//      return _.reduce(slice.call(arguments, 1),function(ret,newarr){
//        return _.reduce(ret,function(memo,oldi){
//          return memo.concat(_.map(newarr,function(newi){
//            return oldi.concat([newi]);
//          }));
//        },[]);
//      },_.map(arguments[0],function(i){return [i];}));
//    }

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
      normalize: 335,
      doNormalize: false,
      type: 'Helmets',
      showBlues: false,
      showExotics: true,
      showYear1: false,
      combinations: null,
      statOrder: '-stats.STAT_INTELLECT.value',
      ranked: {},
      filter: {
        int: 3,
        dis: 2,
        str: 2
      },
      normalizeBuckets: function() {
        function normalizeStats(item, mod) {
          item.normalStats = _.map(item.stats, function(stat) {
            return {
              statHash: stat.statHash,
              base: (stat.base*(vm.doNormalize ? vm.normalize : item.primStat.value)/item.primStat.value).toFixed(0),
              scaled: stat.scaled,
              split: stat.split,
              qualityPercentage: stat.qualityPercentage
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
