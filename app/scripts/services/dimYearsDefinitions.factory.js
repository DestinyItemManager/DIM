(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimYearsDefinitions', YearsDefinitions);

  YearsDefinitions.$inject = ['$q', '$timeout', '$http'];

  function YearsDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('scripts/api-manifest/year1.json')
      .success(function(data) {
        // TODO: When year2 is over, this'll need to get very minorly more complicated
        deferred.resolve({ year1: data });
      })
      .error(function(data) {
        deferred.reject(new Error('The year one item definition file was not parsed correctly.'));
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
