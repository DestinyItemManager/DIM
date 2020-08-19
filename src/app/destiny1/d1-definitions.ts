import { ManifestDefinitions } from '../destiny2/definitions';
import _ from 'lodash';
import { getManifest } from '../manifest/d1-manifest-service';
import { setD1Manifest } from '../manifest/actions';
import { reportException } from 'app/utils/exceptions';
import { ThunkResult } from 'app/store/types';

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
  'ActivityType',
  'DamageType',
];

const eagerTables = ['InventoryBucket', 'Class', 'Race', 'Faction', 'Vendor'];

export interface DefinitionTable<T> {
  get(hash: number): T;
}

// D1 types don't exist yet
export interface D1ManifestDefinitions extends ManifestDefinitions {
  InventoryItem: DefinitionTable<any>;
  Objective: DefinitionTable<any>;
  SandboxPerk: DefinitionTable<any>;
  Stat: DefinitionTable<any>;
  TalentGrid: DefinitionTable<any>;
  Progression: DefinitionTable<any>;
  Record: DefinitionTable<any>;
  ItemCategory: DefinitionTable<any>;
  VendorCategory: DefinitionTable<any>;
  RecordBook: DefinitionTable<any>;
  ActivityCategory: DefinitionTable<any>;
  ScriptedSkull: DefinitionTable<any>;
  Activity: DefinitionTable<any>;
  ActivityType: DefinitionTable<any>;
  DamageType: DefinitionTable<any>;

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
export function getDefinitions(): ThunkResult<D1ManifestDefinitions> {
  return async (dispatch, getState) => {
    try {
      let existingManifest = getState().manifest.d1Manifest;
      if (existingManifest) {
        return existingManifest;
      }
      const db = await dispatch(getManifest());
      existingManifest = getState().manifest.d1Manifest;
      if (existingManifest) {
        return existingManifest;
      }
      const defs = {
        isDestiny1: () => true,
        isDestiny2: () => false,
      };
      // Load objects that lazily load their properties from the sqlite DB.
      lazyTables.forEach((tableShort) => {
        const table = `Destiny${tableShort}Definition`;
        defs[tableShort] = {
          get(id: number, requestor?: any) {
            const dbTable = db[table];
            if (!dbTable) {
              throw new Error(`Table ${table} does not exist in the manifest`);
            }
            const dbEntry = dbTable[id];
            if (!dbEntry) {
              const requestingEntryInfo =
                typeof requestor === 'object' ? requestor.hash : String(requestor);
              reportException(
                `hashLookupFailureD1: ${table}[${id}]`,
                new Error(`hashLookupFailureD1: ${table}[${id}]`),
                {
                  requestingEntryInfo,
                  failedHash: id,
                  failedComponent: table,
                }
              );
            }
            return dbEntry;
          },
        };
      });
      // Resources that need to be fully loaded (because they're iterated over)
      eagerTables.forEach((tableShort) => {
        const table = `Destiny${tableShort}Definition`;
        defs[tableShort] = db[table];
      });
      dispatch(setD1Manifest(defs as D1ManifestDefinitions));
      return defs as D1ManifestDefinitions;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
