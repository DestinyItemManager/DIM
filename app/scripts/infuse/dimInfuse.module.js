(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$scope', '$rootScope', 'dimStoreService', 'dimItemService'];

  function dimInfuseCtrl($scope, $rootScope, dimStoreService, dimItemService) {
    var vm = this;

    vm.store = $scope.store;
    vm.item = $scope.item;
    vm.infusable = [];

    dimStoreService.getStore(vm.item.owner).then(function(store) {
      _.each(store.items, function(item) {
        // The item is the same type and with more light
        if (item.primStat && (item.type == vm.item.type && item.primStat.value > vm.item.primStat.value)) {
          vm.infusable.push(item);
        }
      });
    });
  }

})();
