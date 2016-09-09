(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimMinMaxCtrl', dimMinMaxCtrl);

  dimMinMaxCtrl.$inject = ['$scope', '$state', '$q', '$timeout', '$location', 'dimStoreService', 'ngDialog'];

  function dimMinMaxCtrl($scope, $state, $q, $timeout, $location, dimStoreService, ngDialog) {
    var vm = this;
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
        (armorpiece.normalStats[1735777505].bonus > 0 ? 'disc ' : '') +
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
            total += o.normalStats[stat][vm.scaleType];
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

    function getBestArmor(bucket, vendorBucket, locked, excluded, lockedPerks) {
      var statHashes = [
          { stats: [144602215, 1735777505], type: 'intdisc' },
          { stats: [144602215, 4244567218], type: 'intstr' },
          { stats: [1735777505, 4244567218], type: 'discstr' },
          { stats: [144602215], type: 'int' },
          { stats: [1735777505], type: 'disc' },
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
          if (obj.bonusType.indexOf('int') > -1) {
            bestCombs.push({ item: obj.item, bonusType: 'int' });
          }
          if (obj.bonusType.indexOf('disc') > -1) {
            bestCombs.push({ item: obj.item, bonusType: 'disc' });
          }
          if (obj.bonusType.indexOf('str') > -1) {
            bestCombs.push({ item: obj.item, bonusType: 'str' });
          }
        });
        armor[armortype] = bestCombs;
      }
      return armor;
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

    angular.extend(vm, {
      active: 'warlock',
      activesets: '5/5/2',
      type: 'Helmet',
      scaleType: 'scaled',
      progress: 0,
      fullMode: false,
      includeVendors: false,
      showBlues: false,
      showExotics: true,
      showYear1: false,
      allSetTiers: [],
      highestsets: {},
      ranked: {},
      activePerks: {},
      excludeditems: [],
      lockeditems: { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null },
      lockedperks: { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} },
      setOrderValues: ['-str_val', '-disc_val', '-int_val'],
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
      onCharacterChange: function() {
        vm.ranked = getActiveBuckets(buckets[vm.active], vendorBuckets[vm.active], vm.includeVendors);
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
        vm.excludeditems = [];
        vm.highestsets = vm.getSetBucketsStep(vm.active);
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
        loadout.classType = ({ warlock: 0, titan: 1, hunter: 2 })[vm.active];

        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout,
          equipAll: true
        });
      },
      getSetBucketsStep: function(activeGaurdian) {
        var bestArmor = getBestArmor(buckets[activeGaurdian], vendorBuckets[activeGaurdian], vm.lockeditems, vm.excludeditems, vm.lockedperks);
        var helms = bestArmor.Helmet || [];
        var gaunts = bestArmor.Gauntlets || [];
        var chests = bestArmor.Chest || [];
        var legs = bestArmor.Leg || [];
        var classItems = bestArmor.ClassItem || [];
        var ghosts = bestArmor.Ghost || [];
        var artifacts = bestArmor.Artifact || [];
        var setMap = {};
        var int;
        var dis;
        var str;
        var set;
        var combos = (helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length);
        if (combos === 0) {
          return null;
        }

        function step(activeGaurdian, h, g, c, l, ci, gh, ar, processedCount) {
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
                        if (validSet(set.armor)) {
                          _.each(set.armor, function(armor) {
                            int = armor.item.normalStats[144602215];
                            dis = armor.item.normalStats[1735777505];
                            str = armor.item.normalStats[4244567218];

                            set.stats.STAT_INTELLECT.value += int[vm.scaleType];
                            set.stats.STAT_DISCIPLINE.value += dis[vm.scaleType];
                            set.stats.STAT_STRENGTH.value += str[vm.scaleType];

                            switch (armor.bonusType) {
                            case 'int': set.stats.STAT_INTELLECT.value += int.bonus; break;
                            case 'disc': set.stats.STAT_DISCIPLINE.value += dis.bonus; break;
                            case 'str': set.stats.STAT_STRENGTH.value += str.bonus; break;
                            }
                          });

                          var tiersString = Math.min(Math.floor(set.stats.STAT_INTELLECT.value / 60), 5) +
                              '/' + Math.min(Math.floor(set.stats.STAT_DISCIPLINE.value / 60), 5) +
                              '/' + Math.min(Math.floor(set.stats.STAT_STRENGTH.value / 60), 5);
                          if (setMap[tiersString]) {
                            setMap[tiersString].push(set);
                          } else {
                            setMap[tiersString] = [set];
                          }
                        }

                        processedCount++;
                        if (processedCount % 50000 === 0) { // do this so the page doesn't lock up
                          if (vm.active !== activeGaurdian || vm.lockedchanged || vm.excludedchanged || vm.perkschanged || $location.path() !== '/best') {
                            // If active gaurdian or page is changed then stop processing combinations
                            vm.lockedchanged = false;
                            vm.excludedchanged = false;
                            vm.perkschanged = false;
                            return;
                          }
                          vm.progress = processedCount / combos;
                          $timeout(step, 0, true, activeGaurdian, h, g, c, l, ci, gh, ar, processedCount);
                          return;
                        }
                      } ar = 0; } gh = 0; } ci = 0; } l = 0; } c = 0; } g = 0; }

          var tiers = _.each(_.groupBy(Object.keys(setMap), function(set) {
            return _.reduce(set.split('/'), function(memo, num){
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

          // Finish progress
          vm.progress = processedCount / combos;
          console.log('processed', combos, 'combinations.');
          console.timeEnd('elapsed');
        }
        console.time('elapsed');
        vm.lockedchanged = false;
        vm.excludedchanged = false;
        vm.perkschanged = false;
        $timeout(step, 0, true, activeGaurdian, 0, 0, 0, 0, 0, 0, 0, 0);
        return setMap;
      },
      getBonus: dimStoreService.getBonus,
      getStore: dimStoreService.getStore,
      // get Items for infusion
      getItems: function() {
        var stores = dimStoreService.getStores();

        if (stores.length === 0) {
          $state.go('inventory');
          return;
        }

        var allItems = [];
        var vendorItems = [];

        vm.active = dimStoreService.getActiveStore().class.toLowerCase() || 'warlock';

        _.each(stores, function(store) {
          var items = _.filter(store.items, function(item) {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.primStat.value >= 280 && // only 280+ light items
              item.stats;
          });

          allItems = allItems.concat(items);
          _.each(items, function(item) {
            // Filter out any unnecessary perks here
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], function(classType) {
                // Filter out any unnecessary perks here
                perks[classType][item.type] = _.chain(perks[classType][item.type].concat(item.talentGrid.nodes))
                                                .uniq(function(node) { return node.hash; })
                                                .reject(function(node) { return _.contains(['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma'], node.name); })
                                                .value();
              });
            } else {
              perks[item.classTypeName][item.type] = _.chain(perks[item.classTypeName][item.type].concat(item.talentGrid.nodes))
                                                      .uniq(function(node) { return node.hash; })
                                                      .reject(function(node) { return _.contains(['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma'], node.name); })
                                                      .value();
            }
          });

          _.each(store.vendors, function(vendor) {
            var vendItems = _.filter(vendor.items.armor, function(item) {
              return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.primStat.value >= 280 && // only 280+ light items
              item.stats;
            });

            vendorItems = vendorItems.concat(vendItems);
            _.each(vendItems, function(item) {
              if (item.classType === 3) {
                _.each(['warlock', 'titan', 'hunter'], function(classType) {
                  // Filter out any unnecessary perks here
                  vendorPerks[classType][item.type] = _.chain(vendorPerks[classType][item.type].concat(item.talentGrid.nodes))
                                                        .uniq(function(node) { return node.hash; })
                                                        .reject(function(node) { return _.contains(['Infuse', 'Twist Fate', 'Reforge Artifact', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma'], node.name); })
                                                        .value();
                });
              } else {
                // Filter out any unnecessary perks here
                vendorPerks[item.classTypeName][item.type] = _.chain(vendorPerks[item.classTypeName][item.type].concat(item.talentGrid.nodes))
                                                              .uniq(function(node) { return node.hash; })
                                                              .reject(function(node) { return _.contains(['Infuse', 'Twist Fate', 'Reforge Artifact', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma'], node.name); })
                                                              .value();
              }
            });
          });

          // Remove overlapping perks in allPerks from vendorPerks
          _.each(vendorPerks, function(perksWithType, classType) {
            _.each(perksWithType, function(perkArr, type) {
              vendorPerks[classType][type] = _.reject(perkArr, function(perk) { return _.contains(_.pluck(perks[classType][type], 'hash'), perk.hash); });
            });
          });
        });

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
          // put items into buckets and create normalize stats property
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

        function initBuckets() {
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

        initBuckets();
        vm.onCharacterChange(); // start processing
      }
    });
    vm.getItems();
  }
})();
