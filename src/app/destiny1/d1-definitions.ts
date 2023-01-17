import { ThunkResult } from 'app/store/types';
import { reportException } from 'app/utils/exceptions';
import { HashLookupFailure, ManifestDefinitions } from '../destiny2/definitions';
import { setD1Manifest } from '../manifest/actions';
import { getManifest } from '../manifest/d1-manifest-service';
import {
  D1ActivityDefinition,
  D1ActivityTypeDefinition,
  D1ClassDefinition,
  D1DamageTypeDefinition,
  D1FactionDefinition,
  D1InventoryBucketDefinition,
  D1InventoryItemDefinition,
  D1ItemCategoryDefinition,
  D1ObjectiveDefinition,
  D1ProgressionDefinition,
  D1RaceDefinition,
  D1RecordBookDefinition,
  D1RecordDefinition,
  D1StatDefinition,
  D1TalentGridDefinition,
  D1VendorCategoryDefinition,
  D1VendorDefinition,
} from './d1-manifest-types';

const lazyTables = [
  'InventoryItem',
  'Objective',
  'Stat',
  'TalentGrid',
  'Progression',
  'Record',
  'ItemCategory',
  'VendorCategory',
  'RecordBook',
  'Activity',
  'ActivityType',
  'DamageType',
];

const eagerTables = ['InventoryBucket', 'Class', 'Race', 'Faction', 'Vendor'];

export interface DefinitionTable<T> {
  get: (hash: number) => T;
}

// D1 types don't exist yet
export interface D1ManifestDefinitions extends ManifestDefinitions {
  InventoryItem: DefinitionTable<D1InventoryItemDefinition>;
  Objective: DefinitionTable<D1ObjectiveDefinition>;
  Stat: DefinitionTable<D1StatDefinition>;
  TalentGrid: DefinitionTable<D1TalentGridDefinition>;
  Progression: DefinitionTable<D1ProgressionDefinition>;
  Record: DefinitionTable<D1RecordDefinition>;
  ItemCategory: DefinitionTable<D1ItemCategoryDefinition>;
  VendorCategory: DefinitionTable<D1VendorCategoryDefinition>;
  RecordBook: DefinitionTable<D1RecordBookDefinition>;
  Activity: DefinitionTable<D1ActivityDefinition>;
  ActivityType: DefinitionTable<D1ActivityTypeDefinition>;
  DamageType: DefinitionTable<D1DamageTypeDefinition>;

  InventoryBucket: { [hash: number]: D1InventoryBucketDefinition };
  Class: { [hash: number]: D1ClassDefinition };
  Race: { [hash: number]: D1RaceDefinition };
  Faction: { [hash: number]: D1FactionDefinition };
  Vendor: { [hash: number]: D1VendorDefinition };
}

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function getDefinitions(): ThunkResult<D1ManifestDefinitions> {
  return async (dispatch, getState) => {
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
    for (const tableShort of lazyTables) {
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
            reportException(`hashLookupFailureD1`, new HashLookupFailure(table, id), {
              requestingEntryInfo,
              failedHash: id,
              failedComponent: table,
            });
          }
          return dbEntry;
        },
      };
    }
    // Resources that need to be fully loaded (because they're iterated over)
    for (const tableShort of eagerTables) {
      const table = `Destiny${tableShort}Definition`;
      defs[tableShort] = db[table];
    }
    dispatch(setD1Manifest(defs as D1ManifestDefinitions));
    return defs as D1ManifestDefinitions;
  };
}
