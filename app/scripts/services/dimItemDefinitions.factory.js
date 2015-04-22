(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemDefinitions', ItemDefinitions);

  ItemDefinitions.$inject = ['$q', '$timeout', '$http'];

  function ItemDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('scripts/api-manifest/items.json')
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(data);
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
