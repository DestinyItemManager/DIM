import * as _ from 'underscore';
import template from './loadout-builder.html';
// tslint:disable-next-line:no-implicit-dependencies
import intellectIcon from 'app/images/intellect.png';
// tslint:disable-next-line:no-implicit-dependencies
import disciplineIcon from 'app/images/discipline.png';
// tslint:disable-next-line:no-implicit-dependencies
import strengthIcon from 'app/images/strength.png';
import { getBonus } from '../inventory/store/character-utils';
import { getDefinitions } from '../destiny1/d1-definitions.service';
import { IComponentOptions, IController, IScope, ITimeoutService, extend, copy } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { LoadoutServiceType, Loadout } from '../loadout/loadout.service';
import { StateService } from '@uirouter/angularjs';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { sum } from '../util';

export const LoadoutBuilderComponent: IComponentOptions = {
  controller: LoadoutBuilderController,
  template,
  controllerAs: 'vm',
  bindings: {
    account: '<'
  }
};

interface DimItemWithNormalStats extends DimItem {
  normalStats: {
    [hash: number]: {
      statHash: number;
      base: number;
      scaled: number;
      bonus: number;
      split: number;
      qualityPercentage: number;
    };
  };
}

function LoadoutBuilderController(
  this: IController & {
    account: DestinyAccount;
    excludeditems: DimItem[];
    activeCharacters: DimStore[];
  },
  $scope: IScope,
  $state: StateService,
  $timeout: ITimeoutService,
  $i18next,
  dimStoreService: StoreServiceType,
  ngDialog,
  dimLoadoutService: LoadoutServiceType,
  dimVendorService
) {
  'ngInject';

  const vm = this;
  vm.reviewsEnabled = $featureFlags.reviewsEnabled;

  if (dimStoreService.getStores().length === 0) {
    $state.go('destiny1.inventory');
    return;
  }

  let buckets = {};
  let vendorBuckets = {};
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

  function getBonusType(armorpiece: DimItemWithNormalStats) {
    if (!armorpiece.normalStats) {
      return '';
    }
    return (armorpiece.normalStats[144602215].bonus > 0 ? 'int ' : '') +
      (armorpiece.normalStats[1735777505].bonus > 0 ? 'dis ' : '') +
      (armorpiece.normalStats[4244567218].bonus > 0 ? 'str' : '');
  }

  function getBestItem(armor: DimItemWithNormalStats[], stats: number[], type: string, nonExotic = false) {
    // for specific armor (Helmet), look at stats (int/dis), return best one.
    return {
      item: _.max(armor, (o) => {
        if (nonExotic && o.isExotic) {
          return 0;
        }
        let bonus = 0;
        let total = 0;
        // tslint:disable-next-line:prefer-for-of
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
    // tslint:disable-next-line:prefer-for-of
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
    // tslint:disable-next-line:prefer-for-of
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
    let best: { item: DimItemWithNormalStats; bonusType: string }[] = [];
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

        let hasPerks: (item: DimItem) => boolean = () => true;

        if (!_.isEmpty(lockedPerks[armortype])) {
          const lockedPerkKeys = Object.keys(lockedPerks[armortype]);
          const andPerkHashes = lockedPerkKeys.filter((perkHash) => lockedPerks[armortype][perkHash].lockType === 'and').map(Number);
          const orPerkHashes = lockedPerkKeys.filter((perkHash) => lockedPerks[armortype][perkHash].lockType === 'or').map(Number);

          hasPerks = (item) => {
            if (!orPerkHashes.length && !andPerkHashes.length) {
              return true;
            }
            function matchNode(perkHash) {
              return item.talentGrid!.nodes.some((n) => n.hash === perkHash);
            }
            return Boolean((orPerkHashes.length && orPerkHashes.some(matchNode)) ||
              (andPerkHashes.length && andPerkHashes.every(matchNode)));
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
    const topSets: any[] = [];
    _.each(setMap, (setType: any) => {
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

  function getItemById(id, type): DimItem | undefined {
    return buckets[vm.active][type].find((i) => i.id === id) ||
      vendorBuckets[vm.active][type].find((i) => i.index === id);
  }

  function alreadyExists(set, id) {
    return _.findWhere(set, { id }) || _.findWhere(set, { index: id });
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

  function filterLoadoutToEquipped(loadout: Loadout) {
    const filteredLoadout = copy(loadout);
    filteredLoadout.items = _.mapObject(filteredLoadout.items, (items) => {
      return items.filter((i) => i.equipped);
    });
    return filteredLoadout;
  }

  getDefinitions().then((defs) => {
    extend(vm, {
      active: 'titan',
      i18nClassNames: _.object(['titan', 'hunter', 'warlock'], _.sortBy(Object.values(defs.Class), (classDef) => classDef.classType).map((c) => c.className)),
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
      lockedItemsValid(droppedId, droppedType) {
        droppedId = getId(droppedId);
        if (alreadyExists(vm.excludeditems, droppedId)) {
          return false;
        }

        const item = getItemById(droppedId, droppedType)!;
        const startCount = ((item.isExotic && item.type !== 'ClassItem') ? 1 : 0);
        return (
          startCount +
          (droppedType !== 'Helmet' && vm.lockeditems.Helmet && vm.lockeditems.Helmet.isExotic) +
          (droppedType !== 'Gauntlets' && vm.lockeditems.Gauntlets && vm.lockeditems.Gauntlets.isExotic) +
          (droppedType !== 'Chest' && vm.lockeditems.Chest && vm.lockeditems.Chest.isExotic) +
          (droppedType !== 'Leg' && vm.lockeditems.Leg && vm.lockeditems.Leg.isExotic)
        ) < 2;
      },
      excludedItemsValid(droppedId, droppedType) {
        return !(vm.lockeditems[droppedType] && alreadyExists([vm.lockeditems[droppedType]], droppedId));
      },
      onSelectedChange(prevIdx, selectedIdx) {
        if (vm.activeCharacters[prevIdx].class !== vm.activeCharacters[selectedIdx].class) {
          vm.active = vm.activeCharacters[selectedIdx].class;
          vm.onCharacterChange();
          vm.selectedCharacter = selectedIdx;
        }
      },
      onCharacterChange() {
        vm.ranked = getActiveBuckets(buckets[vm.active], vendorBuckets[vm.active], vm.includeVendors);
        vm.activeCharacters = dimStoreService.getStores().filter((s) => !s.isVault);
        const activeStore = dimStoreService.getActiveStore()!;
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, (char) => char.id === activeStore.id);
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
        vm.excludeditems = vm.excludeditems.filter((item: DimItem) => item.hash === 2672107540);
        vm.activesets = null;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onActiveSetsChange() {
        vm.activeHighestSets = getActiveHighestSets(vm.highestsets, vm.activesets);
      },
      onModeChange() {
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onIncludeVendorsChange() {
        vm.activePerks = getActiveBuckets(perks[vm.active], vendorPerks[vm.active], vm.includeVendors);
        if (vm.includeVendors) {
          vm.ranked = mergeBuckets(buckets[vm.active], vendorBuckets[vm.active]);
        } else {
          vm.ranked = buckets[vm.active];

          // Filter any vendor items from locked or excluded items
          _.each(vm.lockeditems, (item: DimItem, type) => {
            if (item && item.isVendorItem) {
              vm.lockeditems[type] = null;
            }
          });

          vm.excludeditems = _.filter(vm.excludeditems, (item: DimItem) => {
            return !item.isVendorItem;
          });

          // Filter any vendor perks from locked perks
          _.each(vm.lockedperks, (perkMap, type) => {
            vm.lockedperks[type] = _.omit(perkMap, (_perk, perkHash) => {
              return _.findWhere(vendorPerks[vm.active][type], { hash: Number(perkHash) });
            });
          });
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onPerkLocked(perk, type, $event) {
        let activeType = 'none';
        if ($event.shiftKey) {
          const lockedPerk = vm.lockedperks[type][perk.hash];
          activeType = ($event.shiftKey)
            ? (lockedPerk && lockedPerk.lockType === 'and') ? 'none' : 'and'
            : (lockedPerk && lockedPerk.lockType === 'or') ? 'none' : 'or';
        }

        if (activeType === 'none') {
          delete vm.lockedperks[type][perk.hash];
        } else {
          vm.lockedperks[type][perk.hash] = { icon: perk.icon, description: perk.description, lockType: activeType };
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.perkschanged = true;
        }
      },
      onDrop(droppedId, type) {
        droppedId = getId(droppedId);
        if (vm.lockeditems[type] && alreadyExists([vm.lockeditems[type]], droppedId)) {
          return;
        }
        const item = getItemById(droppedId, type);
        vm.lockeditems[type] = item;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      onRemove(removedType) {
        vm.lockeditems[removedType] = null;

        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      excludeItem(item) {
        vm.onExcludedDrop(item.index, item.type);
      },
      onExcludedDrop(droppedId, type) {
        droppedId = getId(droppedId);
        if (alreadyExists(vm.excludeditems, droppedId) || (vm.lockeditems[type] && alreadyExists([vm.lockeditems[type]], droppedId))) {
          return;
        }
        const item = getItemById(droppedId, type)!;
        vm.excludeditems.push(item);
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.excludedchanged = true;
        }
      },
      onExcludedRemove(removedIndex) {
        vm.excludeditems = vm.excludeditems.filter((excludeditem) => excludeditem.index !== removedIndex);
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.excludedchanged = true;
        }
      },
      lockEquipped() {
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
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      clearLocked() {
        vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
        vm.activesets = null;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      newLoadout(set) {
        ngDialog.closeAll();
        const loadout: Loadout = {
          name: '',
          items: {},
          classType: ({ warlock: 0, titan: 1, hunter: 2 })[vm.active]
        };
        const items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        _.each(items, (itemContainer: any, itemType) => {
          loadout.items[itemType.toString().toLowerCase()] = [itemContainer.item];
        });

        $scope.$broadcast('dim-edit-loadout', {
          loadout,
          equipAll: true,
          showClass: false
        });
      },
      equipItems(set) {
        ngDialog.closeAll();
        let loadout: Loadout = {
          items: {},
          name: $i18next.t('Loadouts.AppliedAuto'),
          classType: ({ warlock: 0, titan: 1, hunter: 2 })[vm.active]
        };
        const items = _.pick(set.armor, 'Helmet', 'Chest', 'Gauntlets', 'Leg', 'ClassItem', 'Ghost', 'Artifact');
        loadout.items.helmet = [items.Helmet.item];
        loadout.items.chest = [items.Chest.item];
        loadout.items.gauntlets = [items.Gauntlets.item];
        loadout.items.leg = [items.Leg.item];
        loadout.items.classitem = [items.ClassItem.item];
        loadout.items.ghost = [items.Ghost.item];
        loadout.items.artifact = [items.Artifact.item];

        loadout = copy(loadout);

        _.each(loadout.items, (val) => {
          val[0].equipped = true;
        });

        return dimLoadoutService.applyLoadout(vm.activeCharacters[vm.selectedCharacter], loadout, true);
      },
      getSetBucketsStep(activeGuardian) {
        const bestArmor: any = getBestArmor(buckets[activeGuardian], vendorBuckets[activeGuardian], vm.lockeditems, vm.excludeditems, vm.lockedperks);
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
                          const set: any = {
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
                            setMap[set.setHash] = { set, tiers: {} };
                            setMap[set.setHash].tiers[tiersString] = { stats: set.stats, configs: [getBonusConfig(set.armor)] };
                          }

                          set.includesVendorItems = pieces.some((armor: any) => armor.item.isVendorItem);
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
                      }
                      ar = 0;
                    }
                    gh = 0;
                  }
                  ci = 0;
                }
                l = 0;
              }
              c = 0;
            }
            g = 0;
          }

          const tiers = _.each(_.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
            return sum(tierString.split('/'), (num) => parseInt(num, 10));
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
      getBonus,
      getStore: dimStoreService.getStore,
      getItems() {
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
                  .uniq((node) => node.hash)
                  .reject((node) => _.contains(unwantedPerkHashes, node.hash))
                  .value();
        }

        function filterItems(items: DimItem[]) {
          return items.filter((item) => {
            return item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              item.talentGrid && item.talentGrid.nodes &&
              ((vm.showBlues && item.tier === 'Rare') || item.tier === 'Legendary' || (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.stats;
          });
        }

        vm.selectedCharacter = dimStoreService.getActiveStore();
        vm.active = vm.selectedCharacter.class.toLowerCase() || 'warlock';
        vm.activeCharacters = _.reject(dimStoreService.getStores(), (s) => s.isVault);
        vm.selectedCharacter = _.findIndex(vm.activeCharacters, (char) => char.id === vm.selectedCharacter.id);

        let allItems: DimItem[] = [];
        let vendorItems: DimItem[] = [];
        _.each(stores, (store) => {
          const items = filterItems(store.items);

          // Exclude felwinters if we have them
          const felwinters = items.filter((i) => i.hash === 2672107540);
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
        _.each(dimVendorService.vendors, (vendor: any) => {
          const vendItems = filterItems(_.select(vendor.allItems.map((i) => i.item), (item) => item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'));
          vendorItems = vendorItems.concat(vendItems);

          // Exclude felwinters if we have them
          const felwinters = vendorItems.filter((i) => i.hash === 2672107540);
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
            vendorPerks[classType][type] = _.reject(perkArr, (perk: any) => _.contains(perks[classType][type].map((i) => i.hash), perk.hash));
          });
        });

        function initBuckets() {
          function normalizeStats(item: DimItemWithNormalStats) {
            item.normalStats = {};
            _.each(item.stats!, (stat: any) => {
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
              return (item.classType === classType || item.classType === 3) && item.stats && item.stats.length;
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

  this.$onChanges = () => {
    vm.activePerks = {};
    vm.excludeditems = [];
    vm.lockeditems = { Helmet: null, Gauntlets: null, Chest: null, Leg: null, ClassItem: null, Artifact: null, Ghost: null };
    vm.lockedperks = { Helmet: {}, Gauntlets: {}, Chest: {}, Leg: {}, ClassItem: {}, Artifact: {}, Ghost: {} };
    if (vm.getItems) {
      vm.getItems();
    }
  };
}
