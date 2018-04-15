import * as _ from 'underscore';
import { D1ManifestService } from '../manifest/manifest-service';
import { $q } from 'ngimport';
import { IPromise } from 'angular';

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

export interface LazyDefinition<T> {
  get(hash: number): T;
}

// D1 types don't exist yet
export interface D1ManifestDefinitions {
  InventoryItem: LazyDefinition<any>;
  Objective: LazyDefinition<any>;
  SandboxPerk: LazyDefinition<any>;
  Stat: LazyDefinition<any>;
  TalentGrid: LazyDefinition<any>;
  Progression: LazyDefinition<any>;
  Record: LazyDefinition<any>;
  ItemCategory: LazyDefinition<any>;
  VendorCategory: LazyDefinition<any>;
  RecordBook: LazyDefinition<any>;
  ActivityCategory: LazyDefinition<any>;
  ScriptedSkull: LazyDefinition<any>;
  Activity: LazyDefinition<any>;
  ActivityType: LazyDefinition<any>;

  InventoryBucket: { [hash: number]: any };
  Class: { [hash: number]: any };
  Race: { [hash: number]: any };
  Faction: { [hash: number]: any };
  Vendor: { [hash: number]: any };
}

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export const getDefinitions: () => IPromise<D1ManifestDefinitions> = _.memoize(() => {
  return $q.when(D1ManifestService.getManifest()
    .then((db) => {
      const defs = {};

      // Load objects that lazily load their properties from the sqlite DB.
      lazyTables.forEach((tableShort) => {
        const table = `Destiny${tableShort}Definition`;
        defs[tableShort] = {
          get(name) {
            if (this.hasOwnProperty(name)) {
              return this[name];
            }
            const val = D1ManifestService.getRecord(db, table, name);
            this[name] = val;
            return val;
          }
        };
      });

      // Resources that need to be fully loaded (because they're iterated over)
      eagerTables.forEach((tableShort) => {
        const table = `Destiny${tableShort}Definition`;
        defs[tableShort] = D1ManifestService.getAllRecords(db, table);
      });

      return defs;
    })
    .catch((e) => {
      console.error(e);
      return $q.reject(e);
    }));
}) as () => IPromise<D1ManifestDefinitions>;
