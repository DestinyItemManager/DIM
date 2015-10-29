(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemDefinitions', ItemDefinitions);

  ItemDefinitions.$inject = ['$q', '$timeout', '$http'];

  function ItemDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('api-manifest/items.json?v=3.1.18.1')
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(new Error('The items definition file was not parsed correctly.'));
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
