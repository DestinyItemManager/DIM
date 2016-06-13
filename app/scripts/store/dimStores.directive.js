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
        '<div ng-if="vm.stores" ng-class="[\'dim-col-\' + vm.charCol, { \'hide-filtered\': vm.hideFilteredItems, itemQuality: vm.itemQuality }]">',
        '  <div class="store-row">',
        '    <div class="store-cell" ng-repeat="store in vm.stores track by store.id">',
        '      <dim-store-heading class="character" store-data="store"></dim-store-heading>',
        '    </div>',
        '  </div>',
        '  <div ng-repeat="(category, buckets) in ::vm.buckets.byCategory track by category" class="section" ng-class="::category | lowercase">',
        '    <div class="title">',
        '      <span>{{::category}}</span>',
        '      <span ng-if="vm.vault.vaultCounts[category] !== undefined" class="bucket-count">{{ vm.vault.vaultCounts[category] }}/{{::vm.vault.capacityForItem({sort: category})}}</span>',
        '    </div>',
        '    <div class="store-row items" ng-repeat="bucket in ::buckets track by bucket.id">',
        '      <div class="store-cell" ng-class="{ vault: store.isVault }" ng-repeat="store in vm.stores track by store.id">',
        '        <dim-store-bucket store-data="store" bucket-items="store.buckets[bucket.id]" bucket="bucket"></dim-store-bucket>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="title">',
        '    <span>Reputation</span>',
        '  </div>',
        '  <div class="store-row items">',
        '    <div class="store-cell" ng-class="{ vault: store.isVault }" ng-repeat="store in vm.stores track by store.id">',
        '      <dim-store-reputation store-data="store"></dim-store-reputation>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', 'dimPlatformService', 'loadingTracker', 'dimBucketService', 'dimInfoService'];

  function StoresCtrl(settings, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService, dimInfoService) {
    var vm = this;

    vm.stores = null;
    vm.vault = null;
    vm.buckets = null;
    dimBucketService.then(function(buckets) {
      vm.buckets = angular.copy(buckets);
    });

    vm.charCol = 3;
    settings.getSettings()
      .then(function(settings) {
        vm.hideFilteredItems = settings.hideFilteredItems;
        vm.charCol = Math.max(3, Math.min(settings.charCol, 5));
        vm.itemQuality = settings.itemQuality;
      });

    $scope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'charCol')) {
        vm.charCol = arg.charCol;
      } else if (_.has(arg, 'hideFilteredItems')) {
        vm.hideFilteredItems = arg.hideFilteredItems;
      } else if (_.has(arg, 'itemQuality')) {
        vm.itemQuality = arg.itemQuality;
      }
    });

    $scope.$on('dim-stores-updated', function (e, stores) {
      vm.stores = stores.stores;
      vm.vault = dimStoreService.getVault();
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
