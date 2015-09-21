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
        '<div ng-repeat="store in vm.stores track by store.id" class="storage dim-col-{{ (store.id === \'vault\') ? vm.vaultCol : vm.charCol }}" ng-class="{ condensed: vm.condensed, guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
        '  <div dim-store-heading store-data="store"></div>',
        '  <div dim-store-items store-data="store"></div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['dimSettingsService', '$scope', 'dimStoreService', '$rootScope', '$q'];

  function StoresCtrl(settings, $scope, dimStoreService, $rootScope, $q) {
    var vm = this;

    vm.stores = null;
    vm.condensed = false;
    vm.charCol = 3;
    vm.vaultCol = 4;

    settings.getSettings()
      .then(function(settings) {
        vm.condensed = settings.condensed;
        vm.charCol = (settings.charCol > 2 && settings.charCol < 6) ? settings.charCol : 3;
        vm.vaultCol = (settings.vaultCol > 3 && settings.vaultCol < 10) ? settings.vaultCol : 4;
      });

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'condensed')) {
        vm.condensed = arg.condensed;
      } else if (_.has(arg, 'charCol')) {
        vm.charCol = arg.charCol;
      } else if (_.has(arg, 'vaultCol')) {
        vm.vaultCol = arg.vaultCol;
      }
    });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      var promise = $q.when(dimStoreService.getStores(true))
        .then(function(stores) {
          vm.stores = stores;
        });

      $rootScope.loadingTracker.addPromise(promise);
    });
  }
})();
