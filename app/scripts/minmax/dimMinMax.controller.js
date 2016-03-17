(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$q', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimWebWorker', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $q, loadingTracker, dimStoreService, dimItemService, ngDialog, dimWebWorker, dimLoadoutService) {
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
      normalize: 320,
      doNormalize: false,
      type: 'Helmets',
      showBlues: false,
      showExotics: true,
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
              base: (stat.base*(vm.doNormalize ? vm.normalize : item.primStat.value)/item.primStat.value).toFixed(0)
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
      getColor: function(value) {
        value = value < 0 ? 0 : value;
        return 'hsl(' + (value/100*120).toString(10) + ',90%,30%)';
      },
      getStore: function(id) {
        return dimStoreService.getStore(id);
      },
      // get Items for infusion
      getItems: function() {
        var stores = dimStoreService.getStores();
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
