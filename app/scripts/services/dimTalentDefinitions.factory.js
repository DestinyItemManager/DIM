(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimTalentDefinitions', TalentDefinitions);

    TalentDefinitions.$inject = ['$q', '$timeout', '$http'];

  function TalentDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('scripts/api-manifest/talent.json?v=3.1.11')
      .then(function(data) {
        deferred.resolve(data);
      },
      function(data) {
        deferred.reject(new Error('The talent definition file was not parsed correctly.'));
      })
      .catch(function() {
        return new Error('The talent definition file was not parsed correctly.');
      });

    return {
      'getDefinitions': function() { return deferred.promise; }
    };
  }
})(angular);
