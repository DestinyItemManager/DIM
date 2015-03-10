(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStore', Store);

  Store.$inject = ['ngDialog'];

  function Store(ngDialog) {
    return {
      bindToController: true,
      controller: StoreCtrl,
      controllerAs: 'vm',
      scope: {},
      template: [
        '<div ng-repeat="store in vm.stores" class="storage">',
        '  <div dim-store-heading store-data="store"></div>',
        '  <div dim-store-items store-data="store"></div>',
        '</div>'
      ].join('')
    };

    StoreCtrl.$inject = ['$scope', 'dimStoreService'];

    function StoreCtrl($scope, dimStoreService) {
      var vm = this;

      vm.stores = dimStoreService.getStores();

      $scope.$watch(function() {
        return dimStoreService.getStores()
      }, function(newVal) {
        vm.stores = newVal;
      });
    }


  }
})();
