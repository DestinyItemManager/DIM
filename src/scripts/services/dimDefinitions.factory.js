import angular from 'angular';
import _ from 'underscore';

const lazyTables = [
  'InventoryItem',
  'Objective',
  'SandboxPerk',
  'Stat',
  'TalentGrid',
  'Progression',
  'Record',
  'ItemCategory',
  'VendorCategory',
  'RecordBook',
  'ActivityCategory',
  'ScriptedSkull',
  'Activity',
  'ActivityType'
];

const eagerTables = [
  'InventoryBucket',
  'Class',
  'Race',
  'Faction',
  'Vendor'
];

const mod = angular.module('dimApp');

mod.factory('dimDefinitions', Definitions);

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
function Definitions($q, dimManifestService) {
  return {
    getDefinitions: _.memoize(() => {
      return $q.when(dimManifestService.getManifest()
        .then((db) => {
          const defs = {};

          // Load objects that lazily load their properties from the sqlite DB.
          lazyTables.forEach((tableShort) => {
            const table = `Destiny${tableShort}Definition`;
            defs[tableShort] = {
              get: function(name) {
                if (this.hasOwnProperty(name)) {
                  return this[name];
                }
                const val = dimManifestService.getRecord(db, table, name);
                this[name] = val;
                return val;
              }
            };
          });

          // Resources that need to be fully loaded (because they're iterated over)
          eagerTables.forEach((tableShort) => {
            const table = `Destiny${tableShort}Definition`;
            defs[tableShort] = dimManifestService.getAllRecords(db, table);
          });

          return defs;
        })
        .catch((e) => {
          console.error(e);
          return $q.reject(e);
        }));
    })
  };
}

