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
        // TODO: big loading indicator?
        // TODO: move width class up here!!
        // TODO: flexbox the equipped stuff too
        '<div ng-if="vm.stores" ng-class="{ \'hide-filtered\': vm.hideFilteredItems, itemQuality: vm.itemQuality }">',
        // '<div ng-repeat="store in vm.stores track by store.id"',
        // '  class="storage dim-col-{{(store.id === \'vault\') ? vm.vaultCol : vm.charCol}}"',
        // '  ng-class="{',
        // "    guardian: !store.isVault,",
        // "    vault: store.isVault,",
        // "    'hide-filtered': vm.hideFilteredItems,",
        // "    'itemQuality': vm.itemQuality,",
        // '  }">',
        // '</div>',
        '  <div class="store-row">',
        '    <div class="store-cell" ng-class="vm.widthClass" ng-repeat="store in vm.stores track by store.id">',
        '      <dim-store-heading class="character" store-data="store"></dim-store-heading>',
        '    </div>',
        '  </div>',
        '  <div ng-repeat="(category, buckets) in ::vm.buckets.byCategory track by category" class="section" ng-class="::category | lowercase">',
        '    <div class="title">',
        '      <span>{{::category}}</span>',
        '      <span class="bucket-count">{{ 0 }}/{{::vm.vault.capacityForItem({sort:category})}}</span>',
        '    </div>',
        '    <div class="store-row items" ng-repeat="bucket in ::buckets track by bucket.id">',
        '      <div class="store-cell" ng-class="[vm.widthClass, { \'expand-vault\': store.isVault }]" ng-repeat="store in vm.stores track by store.id">',
        '        <dim-store-bucket store-data="store" bucket-items="store.buckets[bucket.id]" bucket="bucket"></dim-store-bucket>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <dim-store-reputation ng-repeat="store in vm.stores track by store.id" class="dim-col-{{vm.charCol}}" store-data="store"></dim-store-reputation>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', 'dimPlatformService', 'loadingTracker', 'dimBucketService'];

  function StoresCtrl(settings, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService) {
    var vm = this;

    // TODO: char/vault col?

    // TODO: precompute/update vault sizes, and keep a map for which "titles" go full width

    vm.stores = null;
    vm.vault = null;
    vm.buckets = null;
    dimBucketService.then(function(buckets) {
      vm.buckets = buckets;
    });
    vm.charCol = 3;
    vm.vaultCol = 4;

    $scope.$watch('vm.charCol', function(charCol) {
      vm.widthClass = 'dim-col-' + charCol;
    });

    settings.getSettings()
      .then(function(settings) {
        vm.hideFilteredItems = settings.hideFilteredItems;
        vm.charCol = Math.max(3, Math.min(settings.charCol, 5));
        vm.vaultCol = Math.max(4, Math.min(settings.vaultCol, 12));
        vm.itemQuality = settings.itemQuality;
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
