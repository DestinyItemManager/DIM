import { ManifestDefinitions } from '../destiny2/definitions';
import _ from 'lodash';
import { D1ManifestService } from '../manifest/d1-manifest-service';
import store from '../store/store';
import { setD1Manifest } from '../manifest/actions';

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
  'DamageType'
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
export const getDefinitions = _.once(getUncachedDefinitions);

async function getUncachedDefinitions() {
  try {
    const db = await D1ManifestService.getManifest();
    const defs = {
      isDestiny1: () => true,
      isDestiny2: () => false
    };
    // Load objects that lazily load their properties from the sqlite DB.
    lazyTables.forEach((tableShort) => {
      const table = `Destiny${tableShort}Definition`;
      defs[tableShort] = {
        get(name) {
          if (Object.prototype.hasOwnProperty.call(this, name)) {
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
    store.dispatch(setD1Manifest(defs as D1ManifestDefinitions));
    return defs as D1ManifestDefinitions;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
