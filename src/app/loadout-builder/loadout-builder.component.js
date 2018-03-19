import angular from 'angular';
import _ from 'underscore';
import template from './loadout-builder.html';
import intellectIcon from 'app/images/intellect.png';
import disciplineIcon from 'app/images/discipline.png';
import strengthIcon from 'app/images/strength.png';
import { getBonus } from '../inventory/store/character-utils';
import { getDefinitions } from '../destiny1/d1-definitions.service';

export const LoadoutBuilderComponent = {
  controller: LoadoutBuilderController,
  template,
  controllerAs: 'vm',
  bindings: {
    account: '<'
  }
};

function LoadoutBuilderController($scope, $state, $q, $timeout, $i18next, dimStoreService, ngDialog, dimLoadoutService, dimVendorService) {
  'ngInject';

  const vm = this;
  vm.reviewsEnabled = $featureFlags.reviewsEnabled;

  if (dimStoreService.getStores().length === 0) {
    $state.go('destiny1.inventory');
    return;
  }

  let buckets = [];
  let vendorBuckets = [];
  const perks = {
    warlock: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    titan: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] },
    hunter: { Helmet: [], Gauntlets: [], Chest: [], Leg: [], ClassItem: [], Ghost: [], Artifact: [] }
  };
  const vendorPerks = {
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
    // for specific armor (Helmet), look at stats (int/dis), return best one.
    return {
      item: _.max(armor, (o) => {
        if (nonExotic && o.isExotic) {
          return 0;
        }
        let bonus = 0;
        let total = 0;
        for (let i = 0; i < stats.length; i++) {
          const stat = stats[i];
          const scaleType = (o.tier === 'Rare') ? 'base' : vm.scaleType;
          const normalStats = o.normalStats[stat];
          total += normalStats[scaleType];
          bonus = normalStats.bonus;
        }
        return total + bonus;
      }),
      bonusType: type
    };
  }

  function fillTier(stat) {
    stat.tier = Math.min((stat.value / 60) >> 0, 5);
    stat.value = stat.value % 60;
    stat.tiers = [0, 0, 0, 0, 0];
    stat.tierMax = 60;

    for (let tier = 0; tier < 5; tier++) {
      if (tier < stat.tier) {
        stat.tiers[tier] = 60;
      } else if (tier === stat.tier) {
        stat.tiers[tier] = stat.value;
        break;
      }
    }
  }

  function calcArmorStats(pieces, stats) {
    for (let i = 0; i < pieces.length; i++) {
      const armor = pieces[i];
      const int = armor.item.normalStats[144602215];
      const dis = armor.item.normalStats[1735777505];
      const str = armor.item.normalStats[4244567218];

      const scaleType = (armor.item.tier === 'Rare') ? 'base' : vm.scaleType;

      stats.STAT_INTELLECT.value += int[scaleType];
      stats.STAT_DISCIPLINE.value += dis[scaleType];
      stats.STAT_STRENGTH.value += str[scaleType];

      switch (armor.bonusType) {
      case 'int': stats.STAT_INTELLECT.value += int.bonus; break;
      case 'dis': stats.STAT_DISCIPLINE.value += dis.bonus; break;
      case 'str': stats.STAT_STRENGTH.value += str.bonus; break;
      }
    }

    fillTier(stats.STAT_INTELLECT);
    fillTier(stats.STAT_DISCIPLINE);
    fillTier(stats.STAT_STRENGTH);
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

  function genSetHash(armorPieces) {
    let hash = '';
    for (let i = 0; i < armorPieces.length; i++) {
      hash += armorPieces[i].item.id;
    }
    return hash;
  }

  function getBestArmor(bucket, vendorBucket, locked, excluded, lockedPerks) {
    const statHashes = [
      { stats: [144602215, 1735777505], type: 'intdis' },
      { stats: [144602215, 4244567218], type: 'intstr' },
      { stats: [1735777505, 4244567218], type: 'disstr' },
      { stats: [144602215], type: 'int' },
      { stats: [1735777505], type: 'dis' },
      { stats: [4244567218], type: 'str' }
    ];
    const armor = {};
    let best = [];
    let curbest;
    let bestCombs;
    let armortype;

    const excludedIndices = new Set(excluded.map((i) => i.index));

    for (armortype in bucket) {
      const combined = (vm.includeVendors) ? bucket[armortype].concat(vendorBucket[armortype]) : bucket[armortype];
      if (locked[armortype]) {
        best = [{ item: locked[armortype], bonusType: getBonusType(locked[armortype]) }];
      } else {
        best = [];

        let hasPerks = function() { return true; };

        if (!_.isEmpty(lockedPerks[armortype])) {
          const lockedPerkKeys = Object.keys(lockedPerks[armortype]);
          const andPerkHashes = lockedPerkKeys.filter((perkHash) => { return lockedPerks[armortype][perkHash].lockType === 'and'; }).map(Number);
          const orPerkHashes = lockedPerkKeys.filter((perkHash) => { return lockedPerks[armortype][perkHash].lockType === 'or'; }).map(Number);

          hasPerks = function(item) {
            if (!orPerkHashes.length && !andPerkHashes.length) {
              return true;
            }
            function matchNode(perkHash) {
              return _.any(item.talentGrid.nodes, { hash: perkHash });
            }
            return (orPerkHashes.length && _.any(orPerkHashes, matchNode)) ||
              (andPerkHashes.length && _.every(andPerkHashes, matchNode));
          };
        }

        // Filter out excluded and non-wanted perks
        const filtered = combined.filter((item) => {
          return !excludedIndices.has(item.index) && hasPerks(item); // Not excluded and has the correct locked perks
        });

        statHashes.forEach((hash, index) => {
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
      _.each(_.uniq(best, false, (o) => {
        return o.item.index;
      }), (obj) => {
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
    let count = 0;
    const topSets = [];
    _.each(setMap, (setType) => {
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

  function getId(index) {
    const split = index.split('-');
    return split[0] === 'vendor' ? index : split[0];
  }

  function getItemById(id, type) {
    return _.findWhere(buckets[vm.active][type], { id: id }) || _.findWhere(vendorBuckets[vm.active][type], { index: id });
  }

  function alreadyExists(set, id) {
    return _.findWhere(set, { id: id }) || _.findWhere(set, { index: id });
  }

  function mergeBuckets(bucket1, bucket2) {
    const merged = {};
    _.each(_.keys(bucket1), (type) => {
      merged[type] = bucket1[type].concat(bucket2[type]);
    });
    return merged;
  }

  function getActiveBuckets(bucket1, bucket2, merge) {
    // Merge both buckets or return bucket1 if merge is false
    return (merge) ? mergeBuckets(bucket1, bucket2) : bucket1;
  }

  function filterLoadoutToEquipped(loadout) {
    const filteredLoadout = angular.copy(loadout);
    filteredLoadout.items = _.mapObject(filteredLoadout.items, (items) => {
      return _.select(items, 'equipped');
    });
    return filteredLoadout;
  }

  getDefinitions().then((defs) => {
    angular.extend(vm, {
      active: 'titan',
      i18nClassNames: _.object(['titan', 'hunter', 'warlock'], _.sortBy(defs.Class, (classDef) => classDef.classType).map((c) => c.className)),
      i18nItemNames: _.object(['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'], [45, 46, 47, 48, 49, 38, 39].map((key) => defs.ItemCategory.get(key).title)),
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

        const item = getItemById(droppedId, droppedType);
        const startCount = ((item.isExotic && item.type !== 'ClassItem') ? 1 : 0);
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
        vm.activeCharacters = _.reject(dimStoreService.getStores(), (s) => { return s.isVault; });
        const activeStore = dimStoreService.getActiveStore();
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, (char) => { return char.id === activeStore.id; });
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
        vm.excludeditems = _.filter(vm.excludeditems, (item) => { return item.hash === 2672107540; });
        vm.activesets = null;
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
          _.each(vm.lockeditems, (item, type) => {
            if (item && item.isVendorItem) {
              vm.lockeditems[type] = null;
            }
          });

          vm.excludeditems = _.filter(vm.excludeditems, (item) => {
            return !item.isVendorItem;
          });

          // Filter any vendor perks from locked perks
          _.each(vm.lockedperks, (perkMap, type) => {
            vm.lockedperks[type] = _.omit(perkMap, (perk, perkHash) => {
              return _.findWhere(vendorPerks[vm.active][type], { hash: Number(perkHash) });
            });
          });
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onPerkLocked: function(perk, type, $event) {
        let activeType = 'none';
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
        const item = getItemById(droppedId, type);
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
        const item = getItemById(droppedId, type);
        vm.excludeditems.push(item);
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.excludedchanged = true;
        }
      },
      onExcludedRemove: function(removedIndex) {
        vm.excludeditems = _.filter(vm.excludeditems, (excludeditem) => { return excludeditem.index !== removedIndex; });
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.excludedchanged = true;
        }
      },
      lockEquipped: function() {
        const store = vm.activeCharacters[vm.selectedCharacter];
        const loadout = filterLoadoutToEquipped(store.loadoutFromCurrentlyEquipped(""));
        const items = _.pick(loadout.items,
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
        vm.activesets = null;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1.0) {
          vm.lockedchanged = true;
        }
      },
      newLoadout: function(set) {
        ngDialog.closeAll();
        const loadout = { items: {} };
        const items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        _.each(items, (itemContainer, itemType) => {
          loadout.items[itemType.toLowerCase()] = [itemContainer.item];
        });
        loadout.classType = ({ warlock: 0, titan: 1, hunter: 2 })[vm.active];

        $scope.$broadcast('dim-edit-loadout', {
          loadout: loadout,
          equipAll: true,
          showClass: false
        });
      },
      equipItems: function(set) {
        ngDialog.closeAll();
        let loadout = { items: {}, name: $i18next.t('Loadouts.AppliedAuto') };
        const items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        loadout.items.helmet = [items.Helmet.item];
        loadout.items.chest = [items.Chest.item];
        loadout.items.gauntlets = [items.Gauntlets.item];
        loadout.items.leg = [items.Leg.item];
        loadout.items.classitem = [items.ClassItem.item];
        loadout.items.ghost = [items.Ghost.item];
        loadout.items.artifact = [items.Artifact.item];
        loadout.classType = ({ warlock: 0, titan: 1, hunter: 2 })[vm.active];

        loadout = angular.copy(loadout);

        _.each(loadout.items, (val) => {
          val[0].equipped = true;
        });

        return dimLoadoutService.applyLoadout(vm.activeCharacters[vm.selectedCharacter], loadout, true);
      },
      getSetBucketsStep: function(activeGuardian) {
        const bestArmor = getBestArmor(buckets[activeGuardian], vendorBuckets[activeGuardian], vm.lockeditems, vm.excludeditems, vm.lockedperks);
        const helms = bestArmor.Helmet || [];
        const gaunts = bestArmor.Gauntlets || [];
        const chests = bestArmor.Chest || [];
        const legs = bestArmor.Leg || [];
        const classItems = bestArmor.ClassItem || [];
        const ghosts = bestArmor.Ghost || [];
        const artifacts = bestArmor.Artifact || [];
        const setMap = {};
        const tiersSet = new Set();
        const combos = (helms.length * gaunts.length * chests.length * legs.length * classItems.length * ghosts.length * artifacts.length);
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
                        const validSet = (
                          Number(helms[h].item.isExotic) +
                            Number(gaunts[g].item.isExotic) +
                            Number(chests[c].item.isExotic) +
                            Number(legs[l].item.isExotic)
                        ) < 2;

                        if (validSet) {
                          const set = {
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
                                icon: intellectIcon
                              },
                              STAT_DISCIPLINE: {
                                value: 0,
                                tier: 0,
                                name: 'Discipline',
                                icon: disciplineIcon
                              },
                              STAT_STRENGTH: {
                                value: 0,
                                tier: 0,
                                name: 'Strength',
                                icon: strengthIcon
                              }
                            },
                            setHash: 0
                          };

                          vm.hasSets = true;
                          const pieces = Object.values(set.armor);
                          set.setHash = genSetHash(pieces);
                          calcArmorStats(pieces, set.stats);
                          const tiersString = `${set.stats.STAT_INTELLECT.tier
                          }/${set.stats.STAT_DISCIPLINE.tier
                          }/${set.stats.STAT_STRENGTH.tier}`;

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

                          set.includesVendorItems = pieces.some((armor) => armor.item.isVendorItem);
                        }

                        processedCount++;
                        if (processedCount % 50000 === 0) { // do this so the page doesn't lock up
                          if (vm.active !== activeGuardian ||
                              vm.lockedchanged ||
                              vm.excludedchanged ||
                              vm.perkschanged ||
                              !$state.is('destiny1.loadout-builder')) {
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
                      } ar = 0;
                    } gh = 0;
                  } ci = 0;
                } l = 0;
              } c = 0;
            } g = 0;
          }

          const tiers = _.each(_.groupBy(Array.from(tiersSet.keys()), (tierString) => {
            return _.reduce(tierString.split('/'), (memo, num) => {
              return memo + parseInt(num, 10);
            }, 0);
          }), (tier) => {
            tier.sort().reverse();
          });

          vm.allSetTiers = [];
          const tierKeys = Object.keys(tiers);
          for (let t = tierKeys.length; t-- > tierKeys.length - 3;) {
            if (tierKeys[t]) {
              vm.allSetTiers.push(`- Tier ${tierKeys[t]} -`);
              _.each(tiers[tierKeys[t]], (set) => {
                vm.allSetTiers.push(set);
              });
            }
          }

          if (!vm.allSetTiers.includes(vm.activesets)) {
            vm.activesets = vm.allSetTiers[1];
          }
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
      getBonus: getBonus,
      getStore: dimStoreService.getStore,
      getItems: function() {
        const stores = dimStoreService.getStores();
        vm.stores = stores;

        if (stores.length === 0) {
          $state.go('destiny1.inventory');
          return;
        }

        function filterPerks(perks, item) {
          // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
          const unwantedPerkHashes = [1270552711, 217480046, 191086989, 913963685, 1034209669, 1263323987, 193091484, 2133116599];
          return _.chain(perks.concat(item.talentGrid.nodes))
                  .uniq((node) => { return node.hash; })
                  .reject((node) => { return _.contains(unwantedPerkHashes, node.hash); })
                  .value();
        }

        function filterItems(items) {
          return _.filter(items, (item) => {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              item.talentGrid && item.talentGrid.nodes &&
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.stats;
          });
        }

        vm.selectedCharacter = dimStoreService.getActiveStore();
        vm.active = vm.selectedCharacter.class.toLowerCase() || 'warlock';
        vm.activeCharacters = _.reject(dimStoreService.getStores(), (s) => { return s.isVault; });
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, (char) => { return char.id === vm.selectedCharacter.id; });

        let allItems = [];
        let vendorItems = [];
        _.each(stores, (store) => {
          const items = filterItems(store.items);

          // Exclude felwinters if we have them
          const felwinters = _.filter(items, { hash: 2672107540 });
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniq(vm.excludeditems, 'id');
          }

          allItems = allItems.concat(items);

          // Build a map of perks
          _.each(items, (item) => {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], (classType) => {
                perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
              });
            } else {
              perks[item.classTypeName][item.type] = filterPerks(perks[item.classTypeName][item.type], item);
            }
          });
        });

        // Process vendors here
        _.each(dimVendorService.vendors, (vendor) => {
          const vendItems = filterItems(_.select(vendor.allItems.map((i) => i.item), (item) => item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'));
          vendorItems = vendorItems.concat(vendItems);

          // Exclude felwinters if we have them
          const felwinters = _.filter(vendorItems, { hash: 2672107540 });
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniq(vm.excludeditems, 'id');
          }

          // Build a map of perks
          _.each(vendItems, (item) => {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], (classType) => {
                vendorPerks[classType][item.type] = filterPerks(vendorPerks[classType][item.type], item);
              });
            } else {
              vendorPerks[item.classTypeName][item.type] = filterPerks(vendorPerks[item.classTypeName][item.type], item);
            }
          });
        });

        // Remove overlapping perks in allPerks from vendorPerks
        _.each(vendorPerks, (perksWithType, classType) => {
          _.each(perksWithType, (perkArr, type) => {
            vendorPerks[classType][type] = _.reject(perkArr, (perk) => { return _.contains(perks[classType][type].map((i) => i.hash), perk.hash); });
          });
        });

        function initBuckets() {
          function normalizeStats(item) {
            item.normalStats = {};
            _.each(item.stats, (stat) => {
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
              Helmet: items.filter((item) => {
                return item.type === 'Helmet';
              }).map(normalizeStats),
              Gauntlets: items.filter((item) => {
                return item.type === 'Gauntlets';
              }).map(normalizeStats),
              Chest: items.filter((item) => {
                return item.type === 'Chest';
              }).map(normalizeStats),
              Leg: items.filter((item) => {
                return item.type === 'Leg';
              }).map(normalizeStats),
              ClassItem: items.filter((item) => {
                return item.type === 'ClassItem';
              }).map(normalizeStats),
              Artifact: items.filter((item) => {
                return item.type === 'Artifact';
              }).map(normalizeStats),
              Ghost: items.filter((item) => {
                return item.type === 'Ghost';
              }).map(normalizeStats)
            };
          }
          function loadBucket(classType, useVendorItems = false) {
            const items = (useVendorItems) ? vendorItems : allItems;
            return getBuckets(items.filter((item) => {
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

        initBuckets(); // Get items
        vm.onCharacterChange(); // Start processing
      }
    });

    // Entry point of builder this get stores and starts processing
    vm.getItems();
  });

  $scope.$onChanges = () => {
    vm.activePerks = {};
    vm.excludeditems = [];
    vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
    vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
    vm.getItems();
  };
}
