import _ from 'underscore';
import { dimState } from '../state';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { settings } from '../settings/settings';
import { getDefinitions } from '../destiny1/d1-definitions.service';
import template from './dimMoveItemProperties.html';

export function MoveItemProperties() {
  return {
    bindToController: true,
    controller: MoveItemPropertiesCtrl,
    controllerAs: 'vm',
    scope: {
      item: '=dimMoveItemProperties',
      compareItem: '=dimCompareItem',
      infuse: '=dimInfuse'
    },
    restrict: 'A',
    replace: true,
    template
  };
}


function MoveItemPropertiesCtrl($sce, $q, dimStoreService, D2StoresService, dimItemService, ngDialog, $scope, $rootScope, dimDestinyTrackerService) {
  'ngInject';
  const vm = this;

  function getStoreService(item) {
    return item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.tab = 'default';

  vm.featureFlags = {
    debugMode: dimState.debug
  };

  vm.hasDetails = Boolean((vm.item.stats && vm.item.stats.length) ||
                          vm.item.talentGrid || vm.item.objectives);
  vm.showDescription = true;
  vm.locking = false;

  dimDestinyTrackerService.getItemReviews(vm.item);

  // The 'i' keyboard shortcut toggles full details
  $scope.$on('dim-toggle-item-details', () => {
    vm.itemDetails = !vm.itemDetails;
  });

  $scope.$watch('vm.itemDetails', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.$emit('popup-size-changed');
    }
  });

  vm.openCompare = function() {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-store-item-compare', {
      item: vm.item,
      dupes: true
    });
  };

  vm.openDiscuss = function() {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-store-item-discuss', {
      item: vm.item
    });
  };

  vm.updateNote = function() {
    if (vm.item.dimInfo.notes === '') {
      delete vm.item.dimInfo.notes;
    }
    vm.item.dimInfo.save();
  };

  vm.reviewBlur = function() {
    const item = vm.item;
    const userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.toUserReview = function(item) {
    const newRating = item.userRating;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;

    const userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.submitReview = function() {
    const item = vm.item;

    dimDestinyTrackerService.submitReview(item);

    return false;
  };

  vm.setItemState = function setItemState(item, type) {
    if (vm.locking) {
      return;
    }

    let store;
    if (item.owner === 'vault') {
      store = getStoreService(item).getActiveStore();
    } else {
      store = getStoreService(item).getStore(item.owner);
    }

    vm.locking = true;

    let state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    if (item.destinyVersion === 2) {
      d2SetLockState(store, item, state)
        .then(() => {
          item.locked = state;
          $rootScope.$broadcast('dim-filter-invalidate');
        })
        .finally(() => {
          vm.locking = false;
        });
    } else {
      d1SetItemState(item, store, state, type)
        .then(() => {
          if (type === 'lock') {
            item.locked = state;
          } else if (type === 'track') {
            item.tracked = state;
          }
          $rootScope.$broadcast('dim-filter-invalidate');
        })
        .finally(() => {
          vm.locking = false;
        });
    }
  };

  vm.classes = {
    'is-arc': false,
    'is-solar': false,
    'is-void': false
  };

  vm.light = null;
  vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
  vm.itemDetails = vm.showDetailsByDefault;
  vm.settings = settings;
  $scope.$watch('vm.settings.itemDetails', (show) => {
    vm.itemDetails = vm.itemDetails || show;
  });

  // DTR 404s on the new D2 languages for D1 items
  let language = vm.settings.language;
  if (vm.item.destinyVersion === 1) {
    switch (language) {
    case 'es-mx':
      language = 'es';
      break;
    case 'pl':
    case 'ru':
    case 'zh-cht':
      language = 'en';
      break;
    }
  } else {
    // For D2, DTR uses English for es-mx
    switch (language) {
    case 'es-mx':
      language = 'es';
      break;
    }
  }
  vm.destinyDBLink = `http://db.destinytracker.com/d${vm.item.destinyVersion}/${vm.settings.language}/items/${vm.item.hash}`;

  if (vm.item.primStat) {
    vm.light = vm.item.primStat.value.toString();
  }
  if (vm.item.dmg) {
    vm.classes[`is-${vm.item.dmg}`] = true;
  }

  if (vm.item.classTypeName !== 'unknown' &&
      // These already include the class name
      vm.item.type !== 'ClassItem' &&
      vm.item.type !== 'Artifact' &&
      vm.item.type !== 'Class') {
    vm.classType = vm.item.classTypeNameLocalized[0].toUpperCase() + vm.item.classTypeNameLocalized.slice(1);
  }

  function compareItems(item) {
    if (item && vm.item.stats) {
      for (const key in Object.getOwnPropertyNames(vm.item.stats)) {
        const itemStats = item.stats && item.stats[key];
        if (itemStats) {
          const vmItemStats = vm.item.stats[key];
          if (vmItemStats) {
            vmItemStats.equippedStatsValue = itemStats.value;
            vmItemStats.equippedStatsName = itemStats.name;
            vmItemStats.comparable = vmItemStats.equippedStatsName === vmItemStats.name ||
              (vmItemStats.name === 'Magazine' && vmItemStats.equippedStatsName === 'Energy') ||
              (vmItemStats.name === 'Energy' && vmItemStats.equippedStatsName === 'Magazine');
          }
        }
      }
    }
  }

  /*
   * Get the item stats and its stat name
   * of the equipped item for comparison
   */
  if (vm.item.equipment) {
    if (vm.compareItem) {
      $scope.$watch('vm.compareItem', compareItems);
    } else {
      $scope.$watch('$parent.$parent.vm.store.items', (items) => {
        const item = _.find(items, (item) => {
          return item.equipped && item.type === vm.item.type;
        });
        compareItems(item);
      });
    }
  }

  vm.dumpDebugInfo = function() {
    console.log(`DEBUG INFO for '${vm.item.name}'`);
    console.log("DIM Item", vm.item);
    console.log("Bungie API Item", vm.item.originalItem || "Enable debug mode (ctrl+alt+shift+d) and refresh items to see this.");
    getDefinitions().then((defs) => {
      console.log("Manifest Item Definition", defs.InventoryItem.get(vm.item.hash));
    });
  };
}
