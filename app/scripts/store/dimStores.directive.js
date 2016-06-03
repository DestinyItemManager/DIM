(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStores', Stores);

  Stores.$inject = ['ngDialog'];

  function Stores(ngDialog) {
    return {
      controller: StoresCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div ng-repeat="store in vm.stores track by store.id"',
        '  class="storage dim-col-{{(store.id === \'vault\') ? vm.vaultCol : vm.charCol}}"',
        '  ng-class="{',
        "    guardian: !store.isVault,",
        "    vault: store.isVault,",
        "    'hide-filtered': vm.hideFilteredItems,",
        "    'itemQuality': vm.itemQuality,",
        '  }">',
        '  <div dim-store-heading class="character dim-col-{{vm.charCol}}" store-data="store"></div>',
        '  <div dim-store-items store-data="store"></div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', 'dimPlatformService', 'loadingTracker', '$q'];

  function StoresCtrl(settings, $scope, dimStoreService, dimPlatformService, loadingTracker, $q) {
    var vm = this;

    vm.stores = null;
    vm.charCol = 3;
    vm.vaultCol = 4;

    settings.getSettings()
      .then(function(settings) {
        vm.hideFilteredItems = settings.hideFilteredItems;
        vm.charCol = Math.max(3, Math.min(settings.charCol, 5));
        vm.vaultCol = Math.max(4, Math.min(settings.vaultCol, 12));
        vm.itemQuality = settings.itemQuality;
        dimStoreService.setHeights();
      });

    $scope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'charCol')) {
        vm.charCol = arg.charCol;
      } else if (_.has(arg, 'vaultCol')) {
        vm.vaultCol = arg.vaultCol;
      } else if (_.has(arg, 'hideFilteredItems')) {
        vm.hideFilteredItems = arg.hideFilteredItems;
      } else if (_.has(arg, 'itemQuality')) {
        vm.itemQuality = arg.itemQuality;
      }
      dimStoreService.setHeights();
    });

    $scope.$on('dim-stores-updated', function (e, stores) {
      vm.stores = stores.stores;
    });

    if ($scope.$root.activePlatformUpdated) {
      loadingTracker.addPromise(dimStoreService.reloadStores());
      $scope.$root.activePlatformUpdated = false;
    } else if(!_.isNull(dimPlatformService.getActive())) {
      loadingTracker.addPromise(dimStoreService.reloadStores());
    }

    $scope.$on('dim-active-platform-updated', function(e, args) {
      loadingTracker.addPromise(dimStoreService.reloadStores());
    });
  }
})();
