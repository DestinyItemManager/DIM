(function () {
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
        '<div ng-repeat="store in vm.stores track by store.id" class="storage" ng-class="{ condensed: vm.condensed, guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
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

    settings.getSetting('condensed')
      .then(function(condensed) {
        vm.condensed = condensed;
      });



    $rootScope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'condensed')) {
        vm.condensed = arg.condensed;
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
