(function(angular) {
  'use strict';

  // These define all the different definition objects, each one of
  // which will be a Promise for the data they contain. Data files are
  // in scripts/api-manifest and have a .json extension. Definition
  // objects will be named dim<Name>Definitions.
  var definitions = {
    Item: 'items',
    ItemBucket: 'buckets',
    Objective: 'objectives',
    SandboxPerk: 'perks',
    Stat: 'stats',
    Talent: 'talent',
    Years: 'year1',
    Progression: 'progression'
  };

  var mod = angular.module('dimApp');
  _.each(definitions, function(file, name) {
    var factory = function($http) {
      //console.time("loading " + name);
      return $http.get('scripts/api-manifest/' + file + '.json?v=3.3.1')
        .then(function(json) {
          //console.timeEnd("loading " + name);
          return json.data;
        })
        .catch(function(e) {
          console.error(e);
        });
    };
    factory.$inject = ['$http'];
    mod.factory('dim' + name + 'Definitions', factory);
  });
})(angular);
