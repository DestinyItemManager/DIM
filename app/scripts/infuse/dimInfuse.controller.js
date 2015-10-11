(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$q', 'dimStoreService', 'dimItemService', 'infuseService', 'dimShareData'];

  function dimInfuseCtrl($q, dimStoreService, dimItemService, infuseService, shareDataService) {
    var vm = this;

    vm.getAllItems = false;
    vm.showLockedItems = false;

    // Get the source item
    vm.item = shareDataService.getItem();
    infuseService.setSourceItem(vm.item);

    // Expose the service to view
    vm.infuseService = infuseService;

    vm.toggleItem = function(item) {
      infuseService.toggleItem(item);
    }

    // get Items for infusion
    vm.getItems = function() {

      dimStoreService.getStores(false, true).then(function(stores) {

        var allItems = [];

        // If we want ALL our weapons, including vault's one
        if (!vm.getAllItems) {
          stores = _.filter(stores, function(store) {
            return store.id === vm.item.owner;
          });
        }

        // all stores
        _.each(stores, function(store, id, list) {
          // all items in store
          var items = _.filter(store.items, function(item) {
            return (item.primStat && (!item.locked || vm.showLockedItems) && item.type == vm.item.type && item.primStat.value > vm.item.primStat.value);
          });

          allItems = allItems.concat(items);

        });

        allItems = _.sortBy(allItems, function(item) {
          return item.primStat.value;
        });

        infuseService.setInfusibleItems(allItems);

      });

    }

    vm.getItems();

  }

})();
