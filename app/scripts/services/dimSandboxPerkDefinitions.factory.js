(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('dimSandboxPerkDefinitions', dimSandboxPerkDefinitions);

    dimSandboxPerkDefinitions.$inject = ['$q', '$timeout', '$http'];

  function dimSandboxPerkDefinitions($q, $timeout, $http) {
    var deferred = $q.defer();

    $http.get('http://destiny.plumbing/raw/mobileWorldContent/en/DestinySandboxPerkDefinition.json', { cache: true })
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
      }
    };
  }
})(angular);
