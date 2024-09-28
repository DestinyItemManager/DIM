import { ThunkResult } from 'app/store/types';
import { reportException } from 'app/utils/sentry';
import { HashLookupFailure } from '../destiny2/definitions';
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

const allTables = [
  'InventoryBucket',
  'Class',
  'Race',
  'Faction',
  'Vendor',
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
] as const;

export interface DefinitionTable<T> {
  readonly get: (hash: number) => T;
  readonly getAll: () => { [hash: number]: T };
}

export interface D1ManifestDefinitions {
  InventoryBucket: DefinitionTable<D1InventoryBucketDefinition>;
  Class: DefinitionTable<D1ClassDefinition>;
  Race: DefinitionTable<D1RaceDefinition>;
  Faction: DefinitionTable<D1FactionDefinition>;
  Vendor: DefinitionTable<D1VendorDefinition>;
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
  /** Check if these defs are from D2. Inside an if statement, these defs will be narrowed to type D2ManifestDefinitions. */
  readonly isDestiny2: false;
}

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function getDefinitions(force = false): ThunkResult<D1ManifestDefinitions> {
  return async (dispatch, getState) => {
    let existingManifest = getState().manifest.d1Manifest;
    if (existingManifest && !force) {
      return existingManifest;
    }
    const db = await dispatch(getManifest());
    existingManifest = getState().manifest.d1Manifest;
    if (existingManifest && !force) {
      return existingManifest;
    }
    const defs: { [table: string]: any; isDestiny2: false } = {
      isDestiny2: false,
    };
    for (const tableShort of allTables) {
      const table = `Destiny${tableShort}Definition` as const;
      const dbTable = db[table];
      defs[tableShort] = {
        get(id: number, requestor?: { hash: number } | string | number) {
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
        getAll() {
          return dbTable;
        },
      };
    }
    dispatch(setD1Manifest(defs as D1ManifestDefinitions));
    return defs as D1ManifestDefinitions;
  };
}
