(function() {
  angular.module('dimApp').factory('dimStoreService', StoreService);

  function StoreService($window) {
    var service = {};

    service.getStores = function getStores() {
      return $window.dimDO.stores;
    }

    return service;
  }
})();
