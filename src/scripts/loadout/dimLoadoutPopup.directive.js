import angular from 'angular';
import _ from 'underscore';
import { sum, flatMap } from '../util';
import template from './dimLoadoutPopup.directive.html';

angular.module('dimApp')
  .directive('dimLoadoutPopup', LoadoutPopup);

function LoadoutPopup() {
  return {
    controller: LoadoutPopupCtrl,
    controllerAs: 'vm',
    bindToController: true,
    restrict: 'A',
    scope: {
      store: '=dimLoadoutPopup'
    },
    replace: true,
    template: template
  };
}

function LoadoutPopupCtrl($rootScope, $scope, ngDialog, dimLoadoutService, dimItemService, toaster, dimFarmingService, $window, dimSearchService, dimPlatformService, $i18next, dimBucketService, $q, dimStoreService) {
  const vm = this;
  vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);

  vm.classTypeId = {
    warlock: 0,
    titan: 1,
    hunter: 2
  }[vm.store.class];
  if (vm.classTypeId === undefined) {
    vm.classTypeId = -1;
  }

  vm.search = dimSearchService;

  function initLoadouts() {
    dimLoadoutService.getLoadouts()
      .then((loadouts) => {
        const platform = dimPlatformService.getActive();

        vm.loadouts = _.sortBy(loadouts, 'name') || [];

        vm.loadouts = _.chain(vm.loadouts)
          .filter((item) => _.isUndefined(item.platform) || item.platform === platform.label)
          .filter((item) => {
            return vm.classTypeId === -1 || ((item.classType === -1) || (item.classType === vm.classTypeId));
          })
          .value();
      });
  }
  $scope.$on('dim-save-loadout', initLoadouts);
  $scope.$on('dim-delete-loadout', initLoadouts);
  initLoadouts();

  vm.newLoadout = function newLoadout() {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-create-new-loadout', { });
  };

  vm.newLoadoutFromEquipped = function newLoadoutFromEquipped($event) {
    ngDialog.closeAll();

    const loadout = filterLoadoutToEquipped(vm.store.loadoutFromCurrentlyEquipped(""));
    // We don't want to prepopulate the loadout with a bunch of cosmetic junk
    // like emblems and ships and horns.
    loadout.items = _.pick(loadout.items,
                           'class',
                           'primary',
                           'special',
                           'heavy',
                           'helmet',
                           'gauntlets',
                           'chest',
                           'leg',
                           'classitem',
                           'artifact',
                           'ghost');
    loadout.classType = vm.classTypeId;
    vm.editLoadout(loadout, $event);
  };

  vm.deleteLoadout = function deleteLoadout(loadout) {
    if ($window.confirm($i18next.t('Loadouts.ConfirmDelete', { name: loadout.name }))) {
      dimLoadoutService.deleteLoadout(loadout)
        .catch((e) => {
          toaster.pop('error',
                      $i18next.t('Loadouts.DeleteErrorTitle'),
                      $i18next.t('Loadouts.DeleteErrorDescription', { loadoutName: vm.loadout.name, error: e.message }));
          console.error(e);
        });
    }
  };

  vm.editLoadout = function editLoadout(loadout) {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-edit-loadout', {
      loadout: loadout,
      showClass: true
    });
  };

  function filterLoadoutToEquipped(loadout) {
    const filteredLoadout = angular.copy(loadout);
    filteredLoadout.items = _.mapObject(filteredLoadout.items, (items) => {
      return _.select(items, 'equipped');
    });
    return filteredLoadout;
  }

  // TODO: move all these fancy loadouts to a new service

  vm.applyLoadout = function applyLoadout(loadout, $event, filterToEquipped) {
    ngDialog.closeAll();
    dimFarmingService.stop();

    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    dimLoadoutService.applyLoadout(vm.store, loadout, true).then(() => {
      vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);
    });
  };

  // A dynamic loadout set up to level weapons and armor
  vm.itemLevelingLoadout = function itemLevelingLoadout($event) {
    const applicableItems = _.select(dimItemService.getItems(), (i) => {
      return i.canBeEquippedBy(vm.store) &&
        i.talentGrid &&
        !i.talentGrid.xpComplete && // Still need XP
        (i.hash !== 2168530918 || // Husk of the pit has a weirdo one-off xp mechanic
        i.hash !== 3783480580 ||
        i.hash !== 2576945954 ||
        i.hash !== 1425539750);
    });

    const bestItemFn = function(item) {
      let value = 0;

      if (item.owner === vm.store.id) {
        // Prefer items owned by this character
        value += 0.5;
        // Leave equipped items alone if they need XP, and on the current character
        if (item.equipped) {
          return 1000;
        }
      } else if (item.owner === 'vault') {
        // Prefer items in the vault over items owned by a different character
        // (but not as much as items owned by this character)
        value += 0.05;
      }

      // Prefer locked items (they're stuff you want to use/keep)
      // and apply different rules to them.
      if (item.locked) {
        value += 500;
        value += [
          'Common',
          'Uncommon',
          'Rare',
          'Legendary',
          'Exotic'
        ].indexOf(item.tier) * 10;
      } else {
        // For unlocked, prefer blue items so when you destroy them you get more mats.
        value += [
          'Common',
          'Uncommon',
          'Exotic',
          'Legendary',
          'Rare'
        ].indexOf(item.tier) * 10;
      }

      // Choose the item w/ the highest XP
      value += 10 * (item.talentGrid.totalXP / item.talentGrid.totalXPRequired);

      value += item.primStat ? item.primStat.value / 1000 : 0;

      return value;
    };

    const loadout = optimalLoadout(applicableItems, bestItemFn, $i18next.t('Loadouts.ItemLeveling'));
    vm.applyLoadout(loadout, $event);
  };

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  vm.maxLightLoadout = function maxLightLoadout($event) {
    // These types contribute to light level
    const lightTypes = ['Primary',
      'Special',
      'Heavy',
      'Helmet',
      'Gauntlets',
      'Chest',
      'Leg',
      'ClassItem',
      'Artifact',
      'Ghost'];

    const applicableItems = _.select(dimItemService.getItems(), (i) => {
      return i.canBeEquippedBy(vm.store) &&
        i.primStat && // has a primary stat (sanity check)
        _.contains(lightTypes, i.type); // one of our selected types
    });

    const bestItemFn = function(item) {
      let value = item.primStat.value;

      // Break ties when items have the same stats. Note that this should only
      // add less than 0.25 total, since in the exotics special case there can be
      // three items in consideration and you don't want to go over 1 total.
      if (item.owner === vm.store.id) {
        // Prefer items owned by this character
        value += 0.1;
        if (item.equipped) {
          // Prefer them even more if they're already equipped
          value += 0.1;
        }
      } else if (item.owner === 'vault') {
        // Prefer items in the vault over items owned by a different character
        // (but not as much as items owned by this character)
        value += 0.05;
      }
      return value;
    };

    const loadout = optimalLoadout(applicableItems, bestItemFn, $i18next.t('Loadouts.MaximizeLight'));
    if ($event) {
      vm.applyLoadout(loadout, $event);
    }
    return loadout;
  };
  vm.maxLightValue = dimLoadoutService.getLight(vm.store, vm.maxLightLoadout());

  // A dynamic loadout set up to level weapons and armor
  vm.gatherEngramsLoadout = function gatherEngramsLoadout($event, options = {}) {
    const engrams = _.select(dimItemService.getItems(), (i) => {
      return i.isEngram() && !i.location.inPostmaster && (options.exotics ? true : !i.isExotic);
    });

    if (engrams.length === 0) {
      let engramWarning = $i18next.t('Loadouts.NoEngrams');
      if (options.exotics) {
        engramWarning = $i18next.t('Loadouts.NoExotics');
      }
      toaster.pop('warning', $i18next.t('Loadouts.GatherEngrams'), engramWarning);
      return;
    }

    const itemsByType = _.mapObject(_.groupBy(engrams, 'type'), (items) => {
      // Sort exotic engrams to the end so they don't crowd out other types
      items = _.sortBy(items, (i) => {
        return i.isExotic ? 1 : 0;
      });
      // No more than 9 engrams of a type
      return _.first(items, 9);
    });

    // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
    const finalItems = {};
    _.each(itemsByType, (items, type) => {
      if (items) {
        finalItems[type.toLowerCase()] = items.map((i) => {
          return angular.copy(i);
        });
      }
    });

    const loadout = {
      classType: -1,
      name: $i18next.t('Loadouts.GatherEngrams'),
      items: finalItems
    };
    vm.applyLoadout(loadout, $event);
  };

  // Move items matching the current search. Max 9 per type.
  vm.searchLoadout = function searchLoadout($event) {
    const items = _.select(dimItemService.getItems(), (i) => {
      return i.visible && !i.location.inPostmaster;
    });

    const itemsByType = _.mapObject(_.groupBy(items, 'type'), (items) => {
      return _.first(items, 9);
    });

    // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
    const finalItems = {};
    _.each(itemsByType, (items, type) => {
      if (items) {
        finalItems[type.toLowerCase()] = items.map((i) => {
          const copy = angular.copy(i);
          copy.equipped = false;
          return copy;
        });
      }
    });

    const loadout = {
      classType: -1,
      name: $i18next.t('Loadouts.FilteredItems'),
      items: finalItems
    };
    vm.applyLoadout(loadout, $event);
  };

  vm.makeRoomForPostmaster = function makeRoomForPostmaster() {
    ngDialog.closeAll();

    dimBucketService.getBuckets().then((buckets) => {
      const postmasterItems = flatMap(buckets.byCategory.Postmaster,
                                      (bucket) => vm.store.buckets[bucket.id]);
      const postmasterItemCountsByType = _.countBy(postmasterItems,
                                                   (i) => i.bucket.id);

      // If any category is full, we'll move enough aside
      const itemsToMove = [];
      _.each(postmasterItemCountsByType, (count, bucket) => {
        if (count > 0) {
          const items = vm.store.buckets[bucket];
          const capacity = vm.store.capacityForItem(items[0]);
          const numNeededToMove = Math.max(0, count + items.length - capacity);
          if (numNeededToMove > 0) {
            // We'll move the lowest-value item to the vault.
            const candidates = _.sortBy(_.select(items, { equipped: false, notransfer: false }), (i) => {
              let value = {
                Common: 0,
                Uncommon: 1,
                Rare: 2,
                Legendary: 3,
                Exotic: 4
              }[i.tier];
              // And low-stat
              if (i.primStat) {
                value += i.primStat.value / 1000.0;
              }
              return value;
            });
            itemsToMove.push(..._.first(candidates, numNeededToMove));
          }
        }
      });

      // TODO: it'd be nice if this were a loadout option
      return moveItemsToVault(itemsToMove, buckets)
        .then(() => {
          toaster.pop('success',
                      $i18next.t('Loadouts.MakeRoom'),
                      $i18next.t('Loadouts.MakeRoomDone', { count: postmasterItems.length, movedNum: itemsToMove.length, store: vm.store.name, context: vm.store.gender }));
        })
        .catch((e) => {
          toaster.pop('error',
                      $i18next.t('Loadouts.MakeRoom'),
                      $i18next.t('Loadouts.MakeRoomError', { error: e.message }));
          throw e;
        });
    });
  };

  // cribbed from dimFarmingService, but modified
  function moveItemsToVault(items) {
    const reservations = {};
    // reserve space for all move-asides
    reservations[vm.store.id] = _.countBy(items, 'type');

    return _.reduce(items, (promise, item) => {
      // Move a single item. We do this as a chain of promises so we can reevaluate the situation after each move.
      return promise
        .then(() => {
          const vault = dimStoreService.getVault();
          const vaultSpaceLeft = vault.spaceLeftForItem(item);
          if (vaultSpaceLeft <= 1) {
            // If we're down to one space, try putting it on other characters
            const otherStores = _.select(dimStoreService.getStores(),
                                         (store) => !store.isVault && store.id !== vm.store.id);
            const otherStoresWithSpace = _.select(otherStores, (store) => store.spaceLeftForItem(item));

            if (otherStoresWithSpace.length) {
              return dimItemService.moveTo(item, otherStoresWithSpace[0], false, item.amount, items, reservations);
            }
          }
          return dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
        });
    }, $q.resolve());
  }

  vm.startFarming = function startFarming() {
    ngDialog.closeAll();
    dimFarmingService.start(vm.store);
  };

  // Generate an optimized loadout based on a filtered set of items and a value function
  function optimalLoadout(applicableItems, bestItemFn, name) {
    const itemsByType = _.groupBy(applicableItems, 'type');

    const isExotic = function(item) {
      return item.isExotic && !item.hasLifeExotic();
    };

    // Pick the best item
    const items = _.mapObject(itemsByType, (items) => {
      return _.max(items, bestItemFn);
    });

    // Solve for the case where our optimizer decided to equip two exotics
    const exoticGroups = [['Primary', 'Special', 'Heavy'], ['Helmet', 'Gauntlets', 'Chest', 'Leg']];
    _.each(exoticGroups, (group) => {
      const itemsInGroup = _.pick(items, group);
      const numExotics = _.select(_.values(itemsInGroup), isExotic).length;
      if (numExotics > 1) {
        const options = [];

        // Generate an option where we use each exotic
        _.each(itemsInGroup, (item, type) => {
          if (isExotic(item)) {
            const option = angular.copy(itemsInGroup);
            let optionValid = true;
            // Switch the other exotic items to the next best non-exotic
            _.each(_.omit(itemsInGroup, type), (otherItem, otherType) => {
              if (isExotic(otherItem)) {
                const nonExotics = _.reject(itemsByType[otherType], isExotic);
                if (_.isEmpty(nonExotics)) {
                  // this option isn't usable because we couldn't swap this exotic for any non-exotic
                  optionValid = false;
                } else {
                  option[otherType] = _.max(nonExotics, bestItemFn);
                }
              }
            });

            if (optionValid) {
              options.push(option);
            }
          }
        });

        // Pick the option where the optimizer function adds up to the biggest number, again favoring equipped stuff
        const bestOption = _.max(options, (opt) => { return sum(_.values(opt), bestItemFn); });
        _.assign(items, bestOption);
      }
    });

    // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
    const finalItems = {};
    _.each(items, (item, type) => {
      const itemCopy = angular.copy(item);
      itemCopy.equipped = true;
      finalItems[type.toLowerCase()] = [itemCopy];
    });

    return {
      classType: -1,
      name: name,
      items: finalItems
    };
  }
}
