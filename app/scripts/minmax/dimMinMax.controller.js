(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService'];

  function dimMinMaxCtrl($scope, $state, $q, loadingTracker, dimStoreService, dimItemService, ngDialog, dimLoadoutService) {
    var vm = this, buckets = [];
    
    function getBestArmor(bucket, locked) {
      var armor = {};
      var best = [];
      for(var armortype in bucket) {
        if(armortype.toLowerCase() === 'classitem' && locked.classItem !== null) {
            var bonus_type = '';
            bonus_type += (locked.classItem.normalStats[0].bonus > 0)? 'int' : '';
            bonus_type += (locked.classItem.normalStats[1].bonus > 0)? 'disc' : '';
            bonus_type += (locked.classItem.normalStats[2].bonus > 0)? 'str' : '';
            best = [{item: locked.classItem, bonus_type: bonus_type}]
        } else if(armortype.toLowerCase() !== 'classitem' && locked[armortype.toLowerCase()] !== null) {
            var bonus_type = '';
            bonus_type += (locked[armortype.toLowerCase()].normalStats[0].bonus > 0)? 'int' : '';
            bonus_type += (locked[armortype.toLowerCase()].normalStats[1].bonus > 0)? 'disc' : '';
            bonus_type += (locked[armortype.toLowerCase()].normalStats[2].bonus > 0)? 'str' : '';
            best = [{item: locked[armortype.toLowerCase()], bonus_type: bonus_type}]
        } else {
            best = [
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); return  stats.scaled + stats.bonus;}), bonus_type: 'int'}, // best int_w_bonus
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'disc'}, // best dis_w_bonus
            {item: _.max(bucket[armortype], function(o){var stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {scaled: 0, bonus: 0}); return stats.scaled + stats.bonus;}), bonus_type: 'str'}, // best str_w_bonus
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}); return int_stats.scaled + int_stats.bonus + disc_stats.scaled; }), bonus_type: 'intdisc'}, // best int_w_bonus + dis
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}); return int_stats.scaled + int_stats.bonus + disc_stats.scaled; }), bonus_type: 'intdisc'}, // best int_w_bonus + dis
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}); return int_stats.scaled + disc_stats.scaled + disc_stats.bonus; }), bonus_type: 'intdisc'}, // best int + dis_w_bonus
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {base: 0}); return int_stats.scaled + disc_stats.scaled + disc_stats.bonus; }), bonus_type: 'intdisc'}, // best int + dis_w_bonus
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return int_stats.scaled + int_stats.bonus + str_stats.scaled; }), bonus_type: 'intstr'}, // best int_w_bonus + str
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return int_stats.scaled + int_stats.bonus + str_stats.scaled; }), bonus_type: 'intstr'}, // best int_w_bonus + str
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return int_stats.scaled + str_stats.scaled + str_stats.bonus; }), bonus_type: 'intstr'}, // best int + str_w_bonus
            {item: _.max(bucket[armortype], function(o){var int_stats = (_.findWhere(o.normalStats, {statHash: 144602215}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return int_stats.scaled + str_stats.scaled + str_stats.bonus; }), bonus_type: 'intstr'}, // best int + str_w_bonus
            {item: _.max(bucket[armortype], function(o){var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return disc_stats.scaled + disc_stats.bonus + str_stats.scaled; }), bonus_type: 'discstr'}, // best dis_w_bonus + str
            {item: _.max(bucket[armortype], function(o){var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return disc_stats.scaled + disc_stats.bonus + str_stats.scaled; }), bonus_type: 'discstr'}, // best dis_w_bonus + str
            {item: _.max(bucket[armortype], function(o){var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return disc_stats.scaled + str_stats.scaled + str_stats.bonus; }), bonus_type: 'discstr'}, // best dis + str_w_bonus
            {item: _.max(bucket[armortype], function(o){var disc_stats = (_.findWhere(o.normalStats, {statHash: 1735777505}) || {scaled: 0, bonus: 0}); var str_stats = (_.findWhere(o.normalStats, {statHash: 4244567218}) || {base: 0}); return disc_stats.scaled + str_stats.scaled + str_stats.bonus; }), bonus_type: 'discstr'}, // best dis + str_w_bonus
            ];
        }
        var unique_objs = _.uniq(best, 'item');
        var best_combs = []
        for(var index in unique_objs) {
            var obj = unique_objs[index];
            if(obj.bonus_type == 'int') {
                best_combs.push({item: obj.item, bonus_type: 'int'});
            } else if (obj.bonus_type == 'disc') {
                best_combs.push({item: obj.item, bonus_type: 'disc'});
            } else if (obj.bonus_type == 'str') {
                best_combs.push({item: obj.item, bonus_type: 'str'});
            } else if (obj.bonus_type == 'intdisc') {
                best_combs.push({item: obj.item, bonus_type: 'int'});
                best_combs.push({item: obj.item, bonus_type: 'disc'});
            } else if (obj.bonus_type == 'intstr') {
                best_combs.push({item: obj.item, bonus_type: 'int'});
                best_combs.push({item: obj.item, bonus_type: 'str'});
            } else if (obj.bonus_type == 'discstr') {
                best_combs.push({item: obj.item, bonus_type: 'disc'});
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
    
    function getSetBuckets(bestArmor) {
        var helms = bestArmor['helmet'];
        var gaunts = bestArmor['gauntlets'];
        var chests = bestArmor['chest'];
        var legs = bestArmor['leg'];
        var classItems = bestArmor['classItem'];
        var ghosts = bestArmor['ghost'];
        var artifacts = bestArmor['artifact'];
        
        var set_map = {};
        var get_val = function(stats, type, target_type) {
            return stats.scaled + ((type == target_type)? stats.bonus : 0);
        }
        
        for(var h = 0; h < helms.length; ++h) {
        for(var g = 0; g < gaunts.length; ++g) {
        for(var c = 0; c < chests.length; ++c) {
        for(var l = 0; l < legs.length; ++l) {
        for(var ci = 0; ci < classItems.length; ++ci) {
        for(var gh = 0; gh < ghosts.length; ++gh) {
        for(var ar = 0; ar < artifacts.length; ++ar) {
            var armor = {helmet: helms[h], gauntlets: gaunts[g], chest: chests[c], leg: legs[l], classItem: classItems[ci], ghost: ghosts[gh], artifact: artifacts[ar]};
            if(validSet(armor)) {
                var set = {armor: armor};
                set.int_val =  get_val(set.armor.helmet.item.normalStats[0], set.armor.helmet.bonus_type, 'int') + get_val(set.armor.gauntlets.item.normalStats[0], set.armor.gauntlets.bonus_type, 'int') + get_val(set.armor.chest.item.normalStats[0], set.armor.chest.bonus_type, 'int') +
                        get_val(set.armor.leg.item.normalStats[0], set.armor.leg.bonus_type, 'int') + get_val(set.armor.classItem.item.normalStats[0], set.armor.classItem.bonus_type, 'int') + get_val(set.armor.ghost.item.normalStats[0], set.armor.ghost.bonus_type, 'int') + get_val(set.armor.artifact.item.normalStats[0], set.armor.artifact.bonus_type, 'int');
                
                set.disc_val =  get_val(set.armor.helmet.item.normalStats[1], set.armor.helmet.bonus_type, 'disc') + get_val(set.armor.gauntlets.item.normalStats[1], set.armor.gauntlets.bonus_type, 'disc') + get_val(set.armor.chest.item.normalStats[1], set.armor.chest.bonus_type, 'disc') +
                        get_val(set.armor.leg.item.normalStats[1], set.armor.leg.bonus_type, 'disc') + get_val(set.armor.classItem.item.normalStats[1], set.armor.classItem.bonus_type, 'disc') + get_val(set.armor.ghost.item.normalStats[1], set.armor.ghost.bonus_type, 'disc') + get_val(set.armor.artifact.item.normalStats[1], set.armor.artifact.bonus_type, 'disc');
                
                set.str_val =  get_val(set.armor.helmet.item.normalStats[2], set.armor.helmet.bonus_type, 'str') + get_val(set.armor.gauntlets.item.normalStats[2], set.armor.gauntlets.bonus_type, 'str') + get_val(set.armor.chest.item.normalStats[2], set.armor.chest.bonus_type, 'str') +
                        get_val(set.armor.leg.item.normalStats[2], set.armor.leg.bonus_type, 'str') + get_val(set.armor.classItem.item.normalStats[2], set.armor.classItem.bonus_type, 'str') + get_val(set.armor.ghost.item.normalStats[2], set.armor.ghost.bonus_type, 'str') + get_val(set.armor.artifact.item.normalStats[2], set.armor.artifact.bonus_type, 'str');
                
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
        }}}}}}}
        return set_map;
    }
    
    // function getSetBuckets(bestArmor) {
      // var combs_all = combinations(bestArmor['helmet'],bestArmor['gauntlets'],bestArmor['chest'],bestArmor['leg'],bestArmor['classItem'],bestArmor['ghost'],bestArmor['artifact']);
      // var combs = _.filter(combs_all, validSet);
      // var get_val = function(stats, type, target_type) {
        // return stats.scaled + ((type == target_type)? stats.bonus : 0);
      // }
      // var set_map = []
      // _.each(combs, function(o) { 
        // var helm = o[0], gaunts = o[1], chest = o[2], legs = o[3], classItem = o[4], ghost = o[5], art = o[6];
        // o.int_val =  get_val(helm.item.normalStats[0], helm.bonus_type, 'int') + get_val(gaunts.item.normalStats[0], gaunts.bonus_type, 'int') + get_val(chest.item.normalStats[0], chest.bonus_type, 'int') +
                // get_val(legs.item.normalStats[0], legs.bonus_type, 'int') + get_val(classItem.item.normalStats[0], classItem.bonus_type, 'int') + get_val(ghost.item.normalStats[0], ghost.bonus_type, 'int') + get_val(art.item.normalStats[0], art.bonus_type, 'int');
        
        // o.disc_val =  get_val(helm.item.normalStats[1], helm.bonus_type, 'disc') + get_val(gaunts.item.normalStats[1], gaunts.bonus_type, 'disc') + get_val(chest.item.normalStats[1], chest.bonus_type, 'disc') +
                // get_val(legs.item.normalStats[1], legs.bonus_type, 'disc') + get_val(classItem.item.normalStats[1], classItem.bonus_type, 'disc') + get_val(ghost.item.normalStats[1], ghost.bonus_type, 'disc') + get_val(art.item.normalStats[1], art.bonus_type, 'disc');
        
        // o.str_val =  get_val(helm.item.normalStats[2], helm.bonus_type, 'str') + get_val(gaunts.item.normalStats[2], gaunts.bonus_type, 'str') + get_val(chest.item.normalStats[2], chest.bonus_type, 'str') +
                // get_val(legs.item.normalStats[2], legs.bonus_type, 'str') + get_val(classItem.item.normalStats[2], classItem.bonus_type, 'str') + get_val(ghost.item.normalStats[2], ghost.bonus_type, 'str') + get_val(art.item.normalStats[2], art.bonus_type, 'str');
        
        // var int_level = Math.min(Math.floor(o.int_val/60), 5);
        // var disc_level = Math.min(Math.floor(o.disc_val/60), 5);
        // var str_level = Math.min(Math.floor(o.str_val/60), 5);
        // var roll_string = int_level.toString() + disc_level.toString() + str_level.toString();
        // if(roll_string in set_map) {
            // set_map[roll_string].push(o);
        // } else {
            // set_map[roll_string] = [o];
        // }
      // });
      // return set_map;
      
      // // var highestInt = _.max(combs, function(o) { 
        // // var helm = o[0].item.normalStats[0], gaunts = o[1].item.normalStats[0], chest = o[2].item.normalStats[0], legs = o[3].item.normalStats[0], classItem = o[4].item.normalStats[0], ghost = o[5].item.normalStats[0], art = o[6].item.normalStats[0];
        // // return get_val(helm, helm.bonus_type, 'int') + get_val(gaunts, gaunts.bonus_type, 'int') + get_val(chest, chest.bonus_type, 'int') +
                // // get_val(legs, legs.bonus_type, 'int') + get_val(classItem, classItem.bonus_type, 'int') + get_val(ghost, ghost.bonus_type, 'int') + get_val(art, art.bonus_type, 'int');
      // // });
      // // var highestDisc = _.max(combs, function(o) { 
        // // var helm = o[0].item.normalStats[1], gaunts = o[1].item.normalStats[1], chest = o[2].item.normalStats[1], legs = o[3].item.normalStats[1], classItem = o[4].item.normalStats[1], ghost = o[5].item.normalStats[1], art = o[6].item.normalStats[1];
        // // return get_val(helm, helm.bonus_type, 'disc') + get_val(gaunts, gaunts.bonus_type, 'disc') + get_val(chest, chest.bonus_type, 'disc') +
                // // get_val(legs, legs.bonus_type, 'disc') + get_val(classItem, classItem.bonus_type, 'disc') + get_val(ghost, ghost.bonus_type, 'disc') + get_val(art, art.bonus_type, 'disc');
      // // });
      // // var highestStr = _.max(combs, function(o) { 
        // // var helm = o[0].item.normalStats[2], gaunts = o[1].item.normalStats[2], chest = o[2].item.normalStats[2], legs = o[3].item.normalStats[2], classItem = o[4].item.normalStats[2], ghost = o[5].item.normalStats[2], art = o[6].item.normalStats[2];
        // // return get_val(helm, helm.bonus_type, 'str') + get_val(gaunts, gaunts.bonus_type, 'str') + get_val(chest, chest.bonus_type, 'str') +
                // // get_val(legs, legs.bonus_type, 'str') + get_val(classItem, classItem.bonus_type, 'str') + get_val(ghost, ghost.bonus_type, 'str') + get_val(art, art.bonus_type, 'str');
      // // });
      // // return highestStr;
    // }
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

    var slice = Array.prototype.slice;
    function combinations() {
      return _.reduce(slice.call(arguments, 1),function(ret,newarr){
        return _.reduce(ret,function(memo,oldi){
          return memo.concat(_.map(newarr,function(newi){
            return oldi.concat([newi]);
          }));
        },[]);
      },_.map(arguments[0],function(i){return [i];}));
    }

    //function getCombinations(items) {
    //  //console.log(items.filter(function(item) { return item.bucket === 3448274439; }))
    //  // load the best items
    //  return combinations(
    //    items.filter(function(item) { return item.bucket === 3448274439; }),
    //    items.filter(function(item) { return item.bucket === 3551918588; }),
    //    items.filter(function(item) { return item.bucket === 14239492; }),
    //    items.filter(function(item) { return item.bucket === 20886954; }),
    //    items.filter(function(item) { return item.bucket === 1585787867; }),
    //    items.filter(function(item) { return item.bucket === 4023194814; }),
    //    items.filter(function(item) { return item.bucket === 434908299; })
    //  );
    //}




//    combinations: function(){
//      return _.reduce(slice.call(arguments, 1),function(ret,newarr){
//        return _.reduce(ret,function(memo,oldi){
//         return memo.concat(_.map(newarr,function(newi){
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
      activesets: '5/5/1',
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
          var exoticCount = (item.tier === 'Exotic')? 1 : 0;
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
        vm.setOrderValues = vm.setOrder.split(',')
      },
      onDrop: function(dropped_id, type) {
          dropped_id = dropped_id.split('-')[1];
          var item = _.findWhere(buckets[vm.active][type], {id: dropped_id});
          vm.lockeditems[type] = item;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
          vm.highestsets = getSetBuckets(bestarmor);
          vm.allSetTiers = Object.keys(vm.highestsets).sort().reverse();
      },
      onRemove: function(removed_type) {
          vm.lockeditems[removed_type] = null;
          var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
          vm.highestsets = getSetBuckets(bestarmor);
          vm.allSetTiers = Object.keys(vm.highestsets).sort().reverse();
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
        
        // Reset
        vm.lockeditems.helmet = null;
        vm.lockeditems.gauntlets = null;
        vm.lockeditems.chest = null;
        vm.lockeditems.leg = null;
        vm.lockeditems.classItem = null;
        vm.lockeditems.ghost = null;
        vm.lockeditems.artifact = null;
        var bestarmor = getBestArmor(buckets[vm.active], vm.lockeditems);
        vm.highestsets = getSetBuckets(bestarmor);
        vm.allSetTiers = Object.keys(vm.highestsets).sort().reverse();
        // vm.highestint = 0;
        // vm.highestdisc = 0;
        // vm.higheststr = 0;
        // _(vm.highestset).each(function(g) { 
            // vm.highestint += (g.bonus_type == 'int')? g.item.normalStats[0].scaled + g.item.normalStats[0].bonus : g.item.normalStats[0].scaled;
            // vm.highestdisc += (g.bonus_type == 'disc')? g.item.normalStats[1].scaled + g.item.normalStats[1].bonus : g.item.normalStats[1].scaled;
            // vm.higheststr += (g.bonus_type == 'str')? g.item.normalStats[2].scaled + g.item.normalStats[2].bonus : g.item.normalStats[2].scaled;
        // });
        vm.ranked = normalized;//doRankArmor(normalized, getBestArmor(normalized));
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
