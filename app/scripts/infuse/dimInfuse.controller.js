(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['dimStoreService', 'dimItemService', 'infuseService', 'dimShareData'];

  function dimInfuseCtrl(dimStoreService, dimItemService, infuseService, shareDataService) {
    var vm = this;

    // vm.item = $scope.item;
    vm.item = shareDataService.getItem();
    vm.infuseService = infuseService;

    infuseService.setSource(vm.item.primStat.value);

    dimStoreService.getStore(vm.item.owner).then(function(store) {

      var items = _.chain(store.items).filter(function(item) {
          return (item.primStat && (item.type == vm.item.type && item.primStat.value > vm.item.primStat.value))
        })
        .sortBy(function(item) {
          return item.primStat.value;
        })
        .value();

      infuseService.setInfusable(items);

    });

    vm.toggleItem = function(item) {
      infuseService.toggleItem(item);
    }

  }

})();
