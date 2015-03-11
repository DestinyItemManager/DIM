(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService'];

  function ItemService(dimStoreService) {
    var service = {};

    service.getItems = function getItems() {
      var returnValue = [];
      var stores = dimStoreService.getStores();

      angular.forEach(stores, function (store) {
        returnValue = returnValue.concat(store.items);
      });

      return returnValue;
    }

    service.getItem = function getItem(id) {
      var items = this.getItems();;

      var item = _.find(items, function (item) {
        return item.id === id;
      });

      return item;
    }

    return service;
  }
})();
