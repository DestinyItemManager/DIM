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
        '<div ng-repeat="store in vm.stores" class="storage" ng-class="{ guardian: store.id !== \'vault\', vault: store.id === \'vault\' }">',
        '  <div dim-store-heading store-data="store"></div>',
        '  <div dim-store-items store-data="store"></div>',
        '</div>'
      ].join('')
    };
  }

  StoresCtrl.$inject = ['$scope', 'dimStoreService'];

  function StoresCtrl($scope, dimStoreService) {
    var vm = this;

    vm.stores = null;

    $scope.$on('dim-active-platform-updated', function(e, args) {
      dimStoreService.getStores(true)
        .then(function(stores) {
          vm.stores = stores;
        });
    });
  }
})();
