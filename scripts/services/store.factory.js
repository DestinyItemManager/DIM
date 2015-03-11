(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = ['$window'];

  function StoreService($window) {
    return {
      getStores: getStores
    };

    function getStores() {
      return ($window.dimDO) ? $window.dimDO.stores : null;
    }
  }
})();
