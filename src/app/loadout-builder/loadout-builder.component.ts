import * as _ from 'lodash';
import copy from 'fast-copy';
import template from './loadout-builder.html';
import intellectIcon from 'app/images/intellect.png';
import disciplineIcon from 'app/images/discipline.png';
import strengthIcon from 'app/images/strength.png';
import { getBonus } from '../inventory/store/character-utils';
import { getDefinitions } from '../destiny1/d1-definitions.service';
import { IComponentOptions, IController, ITimeoutService } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Loadout, dimLoadoutService, LoadoutClass } from '../loadout/loadout.service';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { D1Item, D1GridNode } from '../inventory/item-types';
import { D1Store } from '../inventory/store-types';
import { dimVendorService } from '../vendors/vendor.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { Transition } from '@uirouter/react';
import { newLoadout } from '../loadout/loadout-utils';

// t('LB.Equip')
// t('LB.HideGear')
// t('LB.ShowGear')
// t('LB.ProcessingMode.Fast')
// t('LB.ProcessingMode.Full')
// t('Stats.NoBonus')

export const LoadoutBuilderComponent: IComponentOptions = {
  controller: LoadoutBuilderController,
  template,
  controllerAs: 'vm',
  bindings: {
    account: '<',
    transition: '<'
  }
};
function LoadoutBuilderController(
  this: IController & {
    account: DestinyAccount;
    transition: Transition;
    excludeditems: D1Item[];
    activeCharacters: D1Store[];
    lockedperks: { [armorType in ArmorTypes]: LockedPerkHash };
    reviewsEnabled: boolean;
    active: ClassTypes;
    i18nClassNames: { [classType in ClassTypes]: string };
    i18nItemNames: { [armorType in ArmorTypes]: string };
    activesets: string;
    type: string;
    scaleType: 'base' | 'scaled';
    progress: number;
    fullMode: boolean;
    includeVendors: boolean;
    showBlues: boolean;
    showExotics: boolean;
    showYear1: boolean;
    allSetTiers: string[];
    hasSets: boolean;
    highestsets: { [setHash: number]: SetType };
    activeHighestSets: typeof this.highestsets;
    ranked: ItemBucket;
    activePerks: PerkCombination;
    collapsedConfigs: boolean[];
    lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null };
    setOrderValues: string;
    lockedchanged: boolean;
  },
  $timeout: ITimeoutService,
  $i18next,
  ngDialog
) {
  'ngInject';

  const vm = this;
  vm.reviewsEnabled = $featureFlags.reviewsEnabled;

  let buckets: { [classType in ClassTypes]: ItemBucket } = {
    warlock: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    titan: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    hunter: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    }
  };
  let vendorBuckets: { [classType in ClassTypes]: ItemBucket } = {
    warlock: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    titan: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    hunter: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    }
  };
  const perks: { [classType in ClassTypes]: PerkCombination } = {
    warlock: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    titan: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    hunter: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    }
  };
  const vendorPerks: { [classType in ClassTypes]: PerkCombination } = {
    warlock: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    titan: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    },
    hunter: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Ghost: [],
      Artifact: []
    }
  };

  getDefinitions().then((defs) => {
    Object.assign(vm, {
      active: 'titan',
      i18nClassNames: _.zipObject(
        ['titan', 'hunter', 'warlock'],
        _.sortBy(Object.values(defs.Class), (classDef) => classDef.classType).map(
          (c: any) => c.className
        )
      ),
      i18nItemNames: _.zipObject(
        ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'],
        [45, 46, 47, 48, 49, 38, 39].map((key) => defs.ItemCategory.get(key).title)
      ),
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
      lockeditems: {
        Helmet: null,
        Gauntlets: null,
        Chest: null,
        Leg: null,
        ClassItem: null,
        Artifact: null,
        Ghost: null
      },
      lockedperks: {
        Helmet: {},
        Gauntlets: {},
        Chest: {},
        Leg: {},
        ClassItem: {},
        Artifact: {},
        Ghost: {}
      },
      setOrderValues: ['-str_val', '-dis_val', '-int_val'],
      lockedItemsValid(droppedId: string, droppedType: ArmorTypes) {
        droppedId = getId(droppedId);
        if (alreadyExists(vm.excludeditems, droppedId)) {
          return false;
        }

        const item = getItemById(droppedId, droppedType)!;
        const startCount: number = item.isExotic && item.type !== 'ClassItem' ? 1 : 0;
        return (
          startCount +
            (droppedType !== 'Helmet' && vm.lockeditems.Helmet && vm.lockeditems.Helmet.isExotic
              ? 1
              : 0) +
            (droppedType !== 'Gauntlets' &&
            vm.lockeditems.Gauntlets &&
            vm.lockeditems.Gauntlets.isExotic
              ? 1
              : 0) +
            (droppedType !== 'Chest' && vm.lockeditems.Chest && vm.lockeditems.Chest.isExotic
              ? 1
              : 0) +
            (droppedType !== 'Leg' && vm.lockeditems.Leg && vm.lockeditems.Leg.isExotic ? 1 : 0) <
          2
        );
      },
      excludedItemsValid(droppedId: string, droppedType: ArmorTypes) {
        const lockedItem = vm.lockeditems[droppedType];
        return !(lockedItem && alreadyExists([lockedItem], droppedId));
      },
      onSelectedChange(prevIdx, selectedIdx) {
        if (vm.activeCharacters[prevIdx].class !== vm.activeCharacters[selectedIdx].class) {
          const classType = vm.activeCharacters[selectedIdx].class;
          if (classType !== 'vault') {
            vm.active = classType;
          }
          vm.onCharacterChange();
          vm.selectedCharacter = selectedIdx;
        }
      },
      onCharacterChange() {
        vm.ranked = getActiveBuckets(
          buckets[vm.active],
          vendorBuckets[vm.active],
          vm.includeVendors
        );
        vm.activeCharacters = D1StoresService.getStores().filter((s) => !s.isVault);
        const activeStore = D1StoresService.getActiveStore()!;
        vm.selectedCharacter = _.findIndex(
          vm.activeCharacters,
          (char) => char.id === activeStore.id
        );
        vm.activePerks = getActiveBuckets(
          perks[vm.active],
          vendorPerks[vm.active],
          vm.includeVendors
        );
        vm.lockeditems = {
          Helmet: null,
          Gauntlets: null,
          Chest: null,
          Leg: null,
          ClassItem: null,
          Artifact: null,
          Ghost: null
        };
        vm.lockedperks = {
          Helmet: {},
          Gauntlets: {},
          Chest: {},
          Leg: {},
          ClassItem: {},
          Artifact: {},
          Ghost: {}
        };
        vm.excludeditems = vm.excludeditems.filter((item: D1Item) => item.hash === 2672107540);
        vm.activesets = '';
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onActiveSetsChange() {
        vm.activeHighestSets = getActiveHighestSets(vm.highestsets, vm.activesets);
      },
      onModeChange() {
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onIncludeVendorsChange() {
        vm.activePerks = getActiveBuckets(
          perks[vm.active],
          vendorPerks[vm.active],
          vm.includeVendors
        );
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
            vm.lockedperks[type] = _.omitBy(perkMap, (_perk, perkHash) => {
              return _.find(vendorPerks[vm.active][type], { hash: Number(perkHash) });
            });
          });
        }
        vm.highestsets = vm.getSetBucketsStep(vm.active);
      },
      onPerkLocked(perk: D1GridNode, type: ArmorTypes, $event) {
        const lockedPerk = vm.lockedperks[type][perk.hash];
        const activeType = $event.shiftKey
          ? lockedPerk && lockedPerk.lockType === 'and'
            ? 'none'
            : 'and'
          : lockedPerk && lockedPerk.lockType === 'or'
          ? 'none'
          : 'or';

        if (activeType === 'none') {
          delete vm.lockedperks[type][perk.hash];
        } else {
          vm.lockedperks[type][perk.hash] = {
            icon: perk.icon,
            description: perk.description,
            lockType: activeType
          };
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
      excludeItem(item: D1Item) {
        vm.onExcludedDrop(item.index, item.type);
      },
      onExcludedDrop(droppedId, type) {
        droppedId = getId(droppedId);
        if (
          alreadyExists(vm.excludeditems, droppedId) ||
          (vm.lockeditems[type] && alreadyExists([vm.lockeditems[type]], droppedId))
        ) {
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
        vm.excludeditems = vm.excludeditems.filter(
          (excludeditem) => excludeditem.index !== removedIndex
        );
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.excludedchanged = true;
        }
      },
      lockEquipped() {
        const store = vm.activeCharacters[vm.selectedCharacter];
        const loadout = filterLoadoutToEquipped(store.loadoutFromCurrentlyEquipped(''));
        const items = _.pick(
          loadout.items,
          'helmet',
          'gauntlets',
          'chest',
          'leg',
          'classitem',
          'artifact',
          'ghost'
        );
        // Do not lock items with no stats
        vm.lockeditems.Helmet = items.helmet[0].stats ? (items.helmet[0] as D1Item) : null;
        vm.lockeditems.Gauntlets = items.gauntlets[0].stats ? (items.gauntlets[0] as D1Item) : null;
        vm.lockeditems.Chest = items.chest[0].stats ? (items.chest[0] as D1Item) : null;
        vm.lockeditems.Leg = items.leg[0].stats ? (items.leg[0] as D1Item) : null;
        vm.lockeditems.ClassItem = items.classitem[0].stats ? (items.classitem[0] as D1Item) : null;
        vm.lockeditems.Artifact = items.artifact[0].stats ? (items.artifact[0] as D1Item) : null;
        vm.lockeditems.Ghost = items.ghost[0].stats ? (items.ghost[0] as D1Item) : null;
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      clearLocked() {
        vm.lockeditems = {
          Helmet: null,
          Gauntlets: null,
          Chest: null,
          Leg: null,
          ClassItem: null,
          Artifact: null,
          Ghost: null
        };
        vm.activesets = '';
        vm.highestsets = vm.getSetBucketsStep(vm.active);
        if (vm.progress < 1) {
          vm.lockedchanged = true;
        }
      },
      newLoadout(set) {
        ngDialog.closeAll();
        const loadout = newLoadout('', {});
        loadout.classType = LoadoutClass[vm.active];
        const items = _.pick(
          set.armor,
          'Helmet',
          'Chest',
          'Gauntlets',
          'Leg',
          'ClassItem',
          'Ghost',
          'Artifact'
        );
        _.each(items, (itemContainer: any, itemType) => {
          loadout.items[itemType.toString().toLowerCase()] = [itemContainer.item];
        });

        dimLoadoutService.editLoadout(loadout, {
          equipAll: true,
          showClass: false
        });
      },
      equipItems(set) {
        ngDialog.closeAll();
        let loadout: Loadout = newLoadout($i18next.t('Loadouts.AppliedAuto'), {});
        loadout.classType = LoadoutClass[vm.active];
        const items = _.pick(
          set.armor,
          'Helmet',
          'Chest',
          'Gauntlets',
          'Leg',
          'ClassItem',
          'Ghost',
          'Artifact'
        );
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

        return dimLoadoutService.applyLoadout(
          vm.activeCharacters[vm.selectedCharacter],
          loadout,
          true
        );
      },
      getSetBucketsStep(activeGuardian: string): typeof this.highestsets | null {
        const bestArmor: any = getBestArmor(
          buckets[activeGuardian],
          vendorBuckets[activeGuardian],
          vm.lockeditems,
          vm.excludeditems,
          vm.lockedperks
        );
        const helms = bestArmor.Helmet || [];
        const gaunts = bestArmor.Gauntlets || [];
        const chests = bestArmor.Chest || [];
        const legs = bestArmor.Leg || [];
        const classItems = bestArmor.ClassItem || [];
        const ghosts = bestArmor.Ghost || [];
        const artifacts = bestArmor.Artifact || [];
        const setMap = {};
        const tiersSet = new Set<string>();
        const combos =
          helms.length *
          gaunts.length *
          chests.length *
          legs.length *
          classItems.length *
          ghosts.length *
          artifacts.length;
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
                        const validSet =
                          Number(helms[h].item.isExotic) +
                            Number(gaunts[g].item.isExotic) +
                            Number(chests[c].item.isExotic) +
                            Number(legs[l].item.isExotic) <
                          2;

                        if (validSet) {
                          const set: ArmorSet = {
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
                            setHash: '',
                            includesVendorItems: false
                          };

                          vm.hasSets = true;
                          const pieces = Object.values(set.armor);
                          set.setHash = genSetHash(pieces);
                          calcArmorStats(pieces, set.stats);
                          const tiersString = `${set.stats.STAT_INTELLECT.tier}/${
                            set.stats.STAT_DISCIPLINE.tier
                          }/${set.stats.STAT_STRENGTH.tier}`;

                          tiersSet.add(tiersString);

                          // Build a map of all sets but only keep one copy of armor
                          // so we reduce memory usage
                          if (setMap[set.setHash]) {
                            if (setMap[set.setHash].tiers[tiersString]) {
                              setMap[set.setHash].tiers[tiersString].configs.push(
                                getBonusConfig(set.armor)
                              );
                            } else {
                              setMap[set.setHash].tiers[tiersString] = {
                                stats: set.stats,
                                configs: [getBonusConfig(set.armor)]
                              };
                            }
                          } else {
                            setMap[set.setHash] = { set, tiers: {} };
                            setMap[set.setHash].tiers[tiersString] = {
                              stats: set.stats,
                              configs: [getBonusConfig(set.armor)]
                            };
                          }

                          set.includesVendorItems = pieces.some(
                            (armor: any) => armor.item.isVendorItem
                          );
                        }

                        processedCount++;
                        if (processedCount % 50000 === 0) {
                          // do this so the page doesn't lock up
                          if (
                            vm.active !== activeGuardian ||
                            vm.lockedchanged ||
                            vm.excludedchanged ||
                            vm.perkschanged ||
                            !vm.transition.router.stateService.is('destiny1.loadout-builder')
                          ) {
                            // If active guardian or page is changed then stop processing combinations
                            vm.lockedchanged = false;
                            vm.excludedchanged = false;
                            vm.perkschanged = false;
                            return;
                          }
                          vm.progress = processedCount / combos;
                          $timeout(
                            step,
                            0,
                            true,
                            activeGuardian,
                            h,
                            g,
                            c,
                            l,
                            ci,
                            gh,
                            ar,
                            processedCount
                          );
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

          const tiers = _.each(
            _.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
              return _.sumBy(tierString.split('/'), (num) => parseInt(num, 10));
            }),
            (tier) => {
              tier.sort().reverse();
            }
          );

          vm.allSetTiers = [];
          const tierKeys = Object.keys(tiers);
          for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
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
          vm.collapsedConfigs = [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
          ];

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
      getStore: D1StoresService.getStore,
      getItems() {
        const stores = D1StoresService.getStores();
        vm.stores = stores;

        if (stores.length === 0) {
          vm.transition.router.stateService.go('destiny1.inventory');
          return;
        }

        function filterPerks(perks: D1GridNode[], item: D1Item) {
          // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
          const unwantedPerkHashes = [
            1270552711,
            217480046,
            191086989,
            913963685,
            1034209669,
            1263323987,
            193091484,
            2133116599
          ];
          return _.uniqBy(perks.concat(item.talentGrid!.nodes), (node: any) => node.hash).filter(
            (node: any) => !unwantedPerkHashes.includes(node.hash)
          );
        }

        function filterItems(items: D1Item[]) {
          return items.filter((item) => {
            return (
              item.primStat &&
              item.primStat.statHash === 3897883278 && // has defense hash
              item.talentGrid &&
              item.talentGrid.nodes &&
              ((vm.showBlues && item.tier === 'Rare') ||
                item.tier === 'Legendary' ||
                (vm.showExotics && item.isExotic)) && // is legendary or exotic
              item.stats
            );
          });
        }

        vm.selectedCharacter = D1StoresService.getActiveStore();
        vm.active = vm.selectedCharacter.class.toLowerCase() || 'warlock';
        vm.activeCharacters = _.reject(D1StoresService.getStores(), (s) => s.isVault);
        vm.selectedCharacter = _.findIndex(
          vm.activeCharacters,
          (char) => char.id === vm.selectedCharacter.id
        );

        let allItems: D1Item[] = [];
        let vendorItems: D1Item[] = [];
        _.each(stores, (store) => {
          const items = filterItems(store.items);

          // Exclude felwinters if we have them
          const felwinters = items.filter((i) => i.hash === 2672107540);
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniqBy(vm.excludeditems, (i) => i.id);
          }

          allItems = allItems.concat(items);

          // Build a map of perks
          _.each(items, (item) => {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], (classType) => {
                perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
              });
            } else {
              perks[item.classTypeName][item.type] = filterPerks(
                perks[item.classTypeName][item.type],
                item
              );
            }
          });
        });

        // Process vendors here
        _.each(dimVendorService.vendors, (vendor: any) => {
          const vendItems = filterItems(
            vendor.allItems
              .map((i) => i.item)
              .filter(
                (item) =>
                  item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'
              )
          );
          vendorItems = vendorItems.concat(vendItems);

          // Exclude felwinters if we have them
          const felwinters = vendorItems.filter((i) => i.hash === 2672107540);
          if (felwinters.length) {
            vm.excludeditems.push(...felwinters);
            vm.excludeditems = _.uniqBy(vm.excludeditems, (i) => i.id);
          }

          // Build a map of perks
          _.each(vendItems, (item) => {
            if (item.classType === 3) {
              _.each(['warlock', 'titan', 'hunter'], (classType) => {
                vendorPerks[classType][item.type] = filterPerks(
                  vendorPerks[classType][item.type],
                  item
                );
              });
            } else {
              vendorPerks[item.classTypeName][item.type] = filterPerks(
                vendorPerks[item.classTypeName][item.type],
                item
              );
            }
          });
        });

        // Remove overlapping perks in allPerks from vendorPerks
        _.each(vendorPerks, (perksWithType, classType) => {
          _.each(perksWithType, (perkArr, type) => {
            vendorPerks[classType][type] = _.reject(perkArr, (perk: any) =>
              perks[classType][type].map((i) => i.hash).includes(perk.hash)
            );
          });
        });

        function initBuckets() {
          function normalizeStats(item: D1ItemWithNormalStats) {
            item.normalStats = {};
            _.each(item.stats!, (stat: any) => {
              item.normalStats![stat.statHash] = {
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
          function getBuckets(items: D1Item[]): ItemBucket {
            return {
              Helmet: items
                .filter((item) => {
                  return item.type === 'Helmet';
                })
                .map(normalizeStats),
              Gauntlets: items
                .filter((item) => {
                  return item.type === 'Gauntlets';
                })
                .map(normalizeStats),
              Chest: items
                .filter((item) => {
                  return item.type === 'Chest';
                })
                .map(normalizeStats),
              Leg: items
                .filter((item) => {
                  return item.type === 'Leg';
                })
                .map(normalizeStats),
              ClassItem: items
                .filter((item) => {
                  return item.type === 'ClassItem';
                })
                .map(normalizeStats),
              Artifact: items
                .filter((item) => {
                  return item.type === 'Artifact';
                })
                .map(normalizeStats),
              Ghost: items
                .filter((item) => {
                  return item.type === 'Ghost';
                })
                .map(normalizeStats)
            };
          }
          function loadBucket(classType: DestinyClass, useVendorItems = false): ItemBucket {
            const items = useVendorItems ? vendorItems : allItems;
            return getBuckets(
              items.filter((item) => {
                return (
                  (item.classType === classType || item.classType === 3) &&
                  item.stats &&
                  item.stats.length
                );
              })
            );
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

  this.$onInit = () => {
    if (D1StoresService.getStores().length === 0) {
      this.transition.router.stateService.go('destiny1.inventory');
      return;
    }
  };

  this.$onChanges = () => {
    vm.activePerks = {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Artifact: [],
      Ghost: []
    };
    vm.excludeditems = [];
    vm.lockeditems = {
      Helmet: null,
      Gauntlets: null,
      Chest: null,
      Leg: null,
      ClassItem: null,
      Artifact: null,
      Ghost: null
    };
    vm.lockedperks = {
      Helmet: {},
      Gauntlets: {},
      Chest: {},
      Leg: {},
      ClassItem: {},
      Artifact: {},
      Ghost: {}
    };
    if (vm.getItems) {
      vm.getItems();
    }
  };
}
