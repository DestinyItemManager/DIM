(function(angular) {
  'use strict';

  // These define all the different definition objects, each one of
  // which will be a Promise for the data they contain. Data files are
  // in scripts/api-manifest and have a .json extension. Definition
  // objects will be named dim<Name>Definitions.

  const files = {
    Years: 'year1'
  };

  const lazyTables = {
    Item: 'InventoryItem',
    Objective: 'Objective',
    SandboxPerk: 'SandboxPerk',
    Stat: 'Stat',
    Talent: 'TalentGrid',
    Progression: 'Progression',
    Vendor: 'Vendor',
    Records: 'Record',
    ItemCategory: 'ItemCategory'
  };

  const eagerTables = {
    ItemBucket: 'InventoryBucket',
    Class: 'Class',
    Race: 'Race',
    Faction: 'Faction'
  };

  var mod = angular.module('dimApp');

  // Load objects that lazily load their properties from the sqlite DB.
  _.each(lazyTables, function(tableShort, name) {
    var factory = function(dimManifestService, $q) {
      return dimManifestService.getManifest()
        .then(function(db) {
          const table = `Destiny${tableShort}Definition`;
          return new Proxy({}, {
            get: function(target, name) {
              if (name === 'then') {
                return undefined;
              }

              if (this.hasOwnProperty(name)) {
                return this[name];
              }
              const val = dimManifestService.getRecord(db, table, name);
              this[name] = val;
              return val;
            }
          });
        })
        .catch(function(e) {
          console.error(e);
          return $q.reject(e);
        });
    };
    factory.$inject = ['dimManifestService', '$q'];
    mod.factory(`dim${name}Definitions`, factory);
  });

  // Resources that need to be fully loaded (because they're iterated over)
  _.each(eagerTables, function(tableShort, name) {
    var factory = function(dimManifestService, $q) {
      return dimManifestService.getManifest()
        .then(function(db) {
          const table = `Destiny${tableShort}Definition`;
          return dimManifestService.getAllRecords(db, table);
        })
        .catch(function(e) {
          console.error(e);
          return $q.reject(e);
        });
    };
    factory.$inject = ['dimManifestService', '$q'];
    mod.factory(`dim${name}Definitions`, factory);
  });

  // Resources that come from precomputed JSON files
  _.each(files, function(file, name) {
    var factory = function($http, $q) {
      // console.time("loading " + name);
      return $http.get('scripts/api-manifest/' + file + '.json?v=$DIM_VERSION')
        .then(function(json) {
          // console.timeEnd("loading " + name);
          return json.data;
        })
        .catch(function(e) {
          console.error(e);
          return $q.reject(e);
        });
    };
    factory.$inject = ['$http', '$q'];
    mod.factory(`dim${name}Definitions`, factory);
  });
})(angular);
