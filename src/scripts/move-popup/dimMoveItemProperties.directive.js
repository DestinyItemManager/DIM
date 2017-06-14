import angular from 'angular';
import _ from 'underscore';
import template from './dimMoveItemProperties.directive.html';
import template2 from './dimMoveItemProperties.directive2.html';

angular.module('dimApp')
  .component('dimObjectives', Objectives())
  .directive('dimMoveItemProperties', MoveItemProperties);

function Objectives() {
  return {
    bindings: {
      objectives: '<'
    },
    template: template
  };
}

function MoveItemProperties() {
  return {
    bindToController: true,
    controller: MoveItemPropertiesCtrl,
    controllerAs: 'vm',
    scope: {
      item: '=dimMoveItemProperties',
      compareItem: '=dimCompareItem',
      infuse: '=dimInfuse',
      changeDetails: '&'
    },
    restrict: 'A',
    replace: true,
    template: template2
  };
}


function MoveItemPropertiesCtrl($sce, $q, dimStoreService, dimItemService, dimSettingsService, ngDialog, dimState, $scope, $rootScope, dimDefinitions, dimDestinyTrackerService) {
  var vm = this;

  vm.tab = 'default';

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    compareEnabled: $featureFlags.compareEnabled,
    tagsEnabled: $featureFlags.tagsEnabled,
    debugMode: dimState.debug
  };

  vm.hasDetails = (vm.item.stats && vm.item.stats.length) ||
    vm.item.talentGrid ||
    vm.item.objectives;
  vm.showDescription = true;// || (vm.item.description.length &&
  //    (!vm.item.equipment || (vm.item.objectives && vm.item.objectives.length)));
  vm.locking = false;

  // The 'i' keyboard shortcut toggles full details
  $scope.$on('dim-toggle-item-details', function() {
    vm.itemDetails = !vm.itemDetails;
    vm.changeDetails();
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
    if (angular.isDefined(vm.item.dimInfo.notes)) {
      vm.item.dimInfo.save();
    }
  };

  vm.reviewBlur = function() {
    var item = vm.item;
    var userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.toUserReview = function(item) {
    var newRating = item.userRating;
    var review = item.userReview;
    var pros = item.userReviewPros;
    var cons = item.userReviewCons;

    var userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.submitReview = function() {
    var item = vm.item;

    var userReview = vm.toUserReview(item);

    $rootScope.$broadcast('review-submitted', item, userReview);

    return false;
  };

  vm.setItemState = function setItemState(item, type) {
    if (vm.locking) {
      return;
    }

    var store;
    if (item.owner === 'vault') {
      store = dimStoreService.getStores()[0];
    } else {
      store = dimStoreService.getStore(item.owner);
    }

    vm.locking = true;

    var state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    dimItemService.setItemState(item, store, state, type)
      .then(function(lockState) {
        if (type === 'lock') {
          item.locked = lockState;
        } else if (type === 'track') {
          item.tracked = lockState;
        }
        $rootScope.$broadcast('dim-filter-invalidate');
      })
      .finally(function() {
        vm.locking = false;
      });
  };

  vm.classes = {
    'is-arc': false,
    'is-solar': false,
    'is-void': false
  };

  vm.light = null;
  vm.classType = '';
  vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
  vm.itemDetails = vm.showDetailsByDefault;
  vm.settings = dimSettingsService;
  $scope.$watch('vm.settings.itemDetails', function(show) {
    vm.itemDetails = vm.itemDetails || show;
  });

  if (vm.item.primStat) {
    vm.light = vm.item.primStat.value.toString();
    if (vm.item.dmg) {
      vm.classes['is-' + vm.item.dmg] = true;
    }
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
      for (var key in Object.getOwnPropertyNames(vm.item.stats)) {
        var itemStats = item.stats && item.stats[key];
        if (itemStats) {
          var vmItemStats = vm.item.stats[key];
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
      $scope.$watch('$parent.$parent.vm.store.items', function(items) {
        var item = _.find(items, function(item) {
          return item.equipped && item.type === vm.item.type;
        });
        compareItems(item);
      });
    }
  }

  vm.dumpDebugInfo = function() {
    console.log("DEBUG INFO for '" + vm.item.name + "'");
    console.log("DIM Item", vm.item);
    console.log("Bungie API Item", vm.item.originalItem || "Enable debug mode (ctrl+alt+shift+d) and refresh items to see this.");
    dimDefinitions.getDefinitions().then((defs) => {
      console.log("Manifest Item Definition", defs.InventoryItem.get(vm.item.hash));
    });
  };
}
