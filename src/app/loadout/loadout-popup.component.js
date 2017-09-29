import angular from 'angular';
import _ from 'underscore';
import { flatMap } from '../util';
import { optimalLoadout } from './loadout-utils';
import template from './loadout-popup.html';
import './loadout-popup.scss';

export const LoadoutPopupComponent = {
  controller: LoadoutPopupCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<'
  },
  template
};

function LoadoutPopupCtrl($rootScope, $scope, ngDialog, dimLoadoutService, dimItemService, toaster, dimFarmingService, D2FarmingService, $window, dimSearchService, dimPlatformService, $i18next, dimBucketService, D2BucketsService, $q, dimStoreService, D2StoresService, $stateParams) {
  'ngInject';
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

  const storeService = this.store.destinyVersion === 1 ? dimStoreService : D2StoresService;

  function initLoadouts() {
    dimLoadoutService.getLoadouts()
      .then((loadouts) => {
        const platform = dimPlatformService.getActive();

        vm.loadouts = _.sortBy(loadouts, 'name') || [];

        vm.loadouts = vm.loadouts.filter((loadout) => {
          return (vm.store.destinyVersion === 2
            ? loadout.destinyVersion === 2 : loadout.destinyVersion !== 2) &&
            (_.isUndefined(loadout.platform) ||
                  loadout.platform === platform.platformLabel) &&
            (vm.classTypeId === -1 ||
             loadout.classType === -1 ||
             loadout.classType === vm.classTypeId);
        });
      });
  }
  $scope.$on('dim-save-loadout', initLoadouts);
  $scope.$on('dim-delete-loadout', initLoadouts);
  initLoadouts();

  vm.newLoadout = function newLoadout($event) {
    ngDialog.closeAll();
    vm.editLoadout({}, $event);
  };

  vm.newLoadoutFromEquipped = function newLoadoutFromEquipped($event) {
    ngDialog.closeAll();

    const loadout = filterLoadoutToEquipped(vm.store.loadoutFromCurrentlyEquipped(""));
    // We don't want to prepopulate the loadout with a bunch of cosmetic junk
    // like emblems and ships and horns.
    loadout.items = _.pick(loadout.items,
                           'class',
                           'kinetic',
                           'energy',
                           'power',
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
    D2FarmingService.stop();

    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    dimLoadoutService.applyLoadout(vm.store, loadout, true).then(() => {
      vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);
    });
  };

  // A dynamic loadout set up to level weapons and armor
  vm.itemLevelingLoadout = function itemLevelingLoadout($event) {
    const applicableItems = _.filter(storeService.getAllItems(), (i) => {
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

    const loadout = optimalLoadout(vm.store, applicableItems, bestItemFn, $i18next.t('Loadouts.ItemLeveling'));
    vm.applyLoadout(loadout, $event);
  };

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  vm.maxLightLoadout = function maxLightLoadout($event) {
    const statHashes = new Set([
      1480404414, // D2 Attack
      3897883278, // D1 & D2 Defense
      368428387 // D1 Attack
    ]);

    const applicableItems = _.filter(storeService.getAllItems(), (i) => {
      return i.canBeEquippedBy(vm.store) &&
        i.primStat && // has a primary stat (sanity check)
        statHashes.has(i.primStat.statHash); // one of our selected stats
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

    const loadout = optimalLoadout(vm.store, applicableItems, bestItemFn, $i18next.t('Loadouts.MaximizeLight'));
    if ($event) {
      vm.applyLoadout(loadout, $event);
    }
    return loadout;
  };

  vm.hasClassified = storeService.getAllItems().some((i) => {
    return i.classified &&
      (i.location.sort === 'Weapons' ||
       i.location.sort === 'Armor' ||
       i.type === 'Ghost');
  });
  vm.maxLightValue = dimLoadoutService.getLight(vm.store, vm.maxLightLoadout()) + (vm.hasClassified ? '*' : '');

  // A dynamic loadout set up to level weapons and armor
  vm.gatherEngramsLoadout = function gatherEngramsLoadout($event, options = {}) {
    const engrams = _.filter(storeService.getAllItems(), (i) => {
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
    const items = _.filter(storeService.getAllItems(), (i) => {
      return i.visible &&
        !i.location.inPostmaster &&
        !i.notransfer &&
        i.owner !== vm.store.id;
    });

    const itemsByType = _.mapObject(_.groupBy(items, 'type'), (items) => {
      return vm.store.isVault ? items : _.first(items, 9);
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

    (vm.store.destinyVersion === 1 ? dimBucketService : D2BucketsService).getBuckets().then((buckets) => {
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
            const candidates = _.sortBy(_.filter(items, { equipped: false, notransfer: false }), (i) => {
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
          const vault = storeService.getVault();
          const vaultSpaceLeft = vault.spaceLeftForItem(item);
          if (vaultSpaceLeft <= 1) {
            // If we're down to one space, try putting it on other characters
            const otherStores = _.filter(storeService.getStores(),
                                         (store) => !store.isVault && store.id !== vm.store.id);
            const otherStoresWithSpace = _.filter(otherStores, (store) => store.spaceLeftForItem(item));

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
    if (vm.store.destinyVersion === 2) {
      D2FarmingService.start({
        membershipId: $stateParams.membershipId,
        platformType: $stateParams.platformType
      }, vm.store.id);
    } else {
      dimFarmingService.start(vm.store);
    }
  };
}
