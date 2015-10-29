(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimStatDefinitions', StatDefinitions);

  StatDefinitions.$inject = ['$q', '$timeout', '$http'];

  function StatDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('api-manifest/stats.json?v=3.1.18.1')
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(new Error('The stats definition file was not parsed correctly.'));
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
