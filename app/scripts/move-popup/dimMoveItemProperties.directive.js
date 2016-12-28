(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMoveItemProperties', MoveItemProperties);

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
      templateUrl: 'scripts/move-popup/dimMoveItemProperties.directive.html'
    };
  }

  MoveItemPropertiesCtrl.$inject = ['$sce', '$q', 'dimStoreService', 'dimItemService', 'dimSettingsService', 'ngDialog', '$scope', '$rootScope', 'dimFeatureFlags', 'dimDefinitions'];

  function MoveItemPropertiesCtrl($sce, $q, storeService, itemService, settings, ngDialog, $scope, $rootScope, dimFeatureFlags, dimDefinitions) {
    var vm = this;

    vm.featureFlags = dimFeatureFlags;

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

    vm.updateNote = function() {
      if (angular.isDefined(vm.item.dimInfo.notes)) {
        vm.item.dimInfo.save();
      }
    };

    vm.setItemState = function setItemState(item, type) {
      if (vm.locking) {
        return;
      }

      var store;
      if (item.owner === 'vault') {
        store = storeService.getStores()[0];
      } else {
        store = storeService.getStore(item.owner);
      }

      vm.locking = true;

      var state = false;
      if (type === 'lock') {
        state = !item.locked;
      } else if (type === 'track') {
        state = !item.tracked;
      }

      itemService.setItemState(item, store, state, type)
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

    vm.light = '';
    vm.classType = '';
    vm.showDetailsByDefault = (!vm.item.equipment && vm.item.notransfer);
    vm.itemDetails = vm.showDetailsByDefault;
    vm.settings = settings;
    $scope.$watch('vm.settings.itemDetails', function(show) {
      vm.itemDetails = vm.itemDetails || show;
    });

    if (vm.item.primStat) {
      vm.light = vm.item.primStat.value.toString();
      vm.light += ' ' + vm.item.primStat.stat.statName;
      if (vm.item.dmg) {
        vm.classes['is-' + vm.item.dmg] = true;
      }
    }

    if (vm.item.classTypeName !== 'unknown' &&
        // These already include the class name
        vm.item.type !== 'ClassItem' &&
        vm.item.type !== 'Artifact' &&
        vm.item.type !== 'Class') {
      vm.classType = vm.item.classTypeName[0].toUpperCase() + vm.item.classTypeName.slice(1);
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
      dimDefinitions.then((defs) => {
        console.log("Manifest Item Definition", defs.InventoryItem[vm.item.hash]);
      });
    };
  }
})();
