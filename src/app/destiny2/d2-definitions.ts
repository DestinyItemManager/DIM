import { UNSET_PLUG_HASH } from 'app/loadout/known-values';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { warnLogCollapsedStack } from 'app/utils/log';
import { reportException } from 'app/utils/sentry';
import {
  AllDestinyManifestComponents,
  DestinyActivityDefinition,
  DestinyActivityModeDefinition,
  DestinyActivityModifierDefinition,
  DestinyBreakerTypeDefinition,
  DestinyClassDefinition,
  DestinyCollectibleDefinition,
  DestinyDamageTypeDefinition,
  DestinyDestinationDefinition,
  DestinyEventCardDefinition,
  DestinyFactionDefinition,
  DestinyGenderDefinition,
  DestinyInventoryBucketDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemCategoryDefinition,
  DestinyLoadoutColorDefinition,
  DestinyLoadoutConstantsDefinition,
  DestinyLoadoutIconDefinition,
  DestinyLoadoutNameDefinition,
  DestinyMaterialRequirementSetDefinition,
  DestinyMetricDefinition,
  DestinyMilestoneDefinition,
  DestinyObjectiveDefinition,
  DestinyPlaceDefinition,
  DestinyPlugSetDefinition,
  DestinyPresentationNodeDefinition,
  DestinyProgressionDefinition,
  DestinyRaceDefinition,
  DestinyRecordDefinition,
  DestinySandboxPerkDefinition,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
  DestinySocketCategoryDefinition,
  DestinySocketTypeDefinition,
  DestinyStatDefinition,
  DestinyStatGroupDefinition,
  DestinyTraitDefinition,
  DestinyVendorDefinition,
  DestinyVendorGroupDefinition,
} from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { setD2Manifest } from '../manifest/actions';
import { getManifest } from '../manifest/manifest-service-json';
import { HashLookupFailure } from './definitions';

type ManifestTablesShort = Exclude<keyof D2ManifestDefinitions, 'isDestiny2'>;

export const allTables: ManifestTablesShort[] = [
  'InventoryItem',
  'Objective',
  'SandboxPerk',
  'Stat',
  'StatGroup',
  'DamageType',
  'Progression',
  'ItemCategory',
  'Activity',
  'ActivityModifier',
  'Vendor',
  'SocketCategory',
  'SocketType',
  'MaterialRequirementSet',
  'Season',
  'SeasonPass',
  'Milestone',
  'Destination',
  'Place',
  'VendorGroup',
  'PlugSet',
  'Collectible',
  'PresentationNode',
  'Record',
  'Metric',
  'Trait',
  'BreakerType',
  'EventCard',
  'LoadoutName',
  'LoadoutIcon',
  'LoadoutColor',
  'InventoryBucket',
  'Class',
  'Gender',
  'Race',
  'Faction',
  'ActivityMode',
  'LoadoutConstants',
];

export interface DefinitionTable<T> {
  /**
   * for troubleshooting/questionable lookups, include second arg
   * and sentry can gather info about the source of the invalid hash.
   * `requestor` ideally a string/number, or a definition including a "hash" key
   */
  readonly get: (hash: number, requestor?: { hash: number } | string | number) => T;
  /** for lookups that frequently may reasonably fail due to def data removal */
  readonly getOptional: (hash: number) => T | undefined;
  readonly getAll: () => { [hash: number]: T };
}

export interface D2ManifestDefinitions {
  InventoryBucket: DefinitionTable<DestinyInventoryBucketDefinition>;
  Class: DefinitionTable<DestinyClassDefinition>;
  Gender: DefinitionTable<DestinyGenderDefinition>;
  Race: DefinitionTable<DestinyRaceDefinition>;
  Faction: DefinitionTable<DestinyFactionDefinition>;
  // ActivityMode is used only from destiny-symbols.ts
  ActivityMode: DefinitionTable<DestinyActivityModeDefinition>;
  InventoryItem: DefinitionTable<DestinyInventoryItemDefinition>;
  Objective: DefinitionTable<DestinyObjectiveDefinition>;
  SandboxPerk: DefinitionTable<DestinySandboxPerkDefinition>;
  Stat: DefinitionTable<DestinyStatDefinition>;
  StatGroup: DefinitionTable<DestinyStatGroupDefinition>;
  Progression: DefinitionTable<DestinyProgressionDefinition>;
  ItemCategory: DefinitionTable<DestinyItemCategoryDefinition>;
  Activity: DefinitionTable<DestinyActivityDefinition>;
  ActivityModifier: DefinitionTable<DestinyActivityModifierDefinition>;
  Vendor: DefinitionTable<DestinyVendorDefinition>;
  SocketCategory: DefinitionTable<DestinySocketCategoryDefinition>;
  SocketType: DefinitionTable<DestinySocketTypeDefinition>;
  MaterialRequirementSet: DefinitionTable<DestinyMaterialRequirementSetDefinition>;
  Season: DefinitionTable<DestinySeasonDefinition>;
  SeasonPass: DefinitionTable<DestinySeasonPassDefinition>;
  Milestone: DefinitionTable<DestinyMilestoneDefinition>;
  Destination: DefinitionTable<DestinyDestinationDefinition>;
  Place: DefinitionTable<DestinyPlaceDefinition>;
  VendorGroup: DefinitionTable<DestinyVendorGroupDefinition>;
  PlugSet: DefinitionTable<DestinyPlugSetDefinition>;
  PresentationNode: DefinitionTable<DestinyPresentationNodeDefinition>;
  Record: DefinitionTable<DestinyRecordDefinition>;
  Metric: DefinitionTable<DestinyMetricDefinition>;
  Trait: DefinitionTable<DestinyTraitDefinition>;
  BreakerType: DefinitionTable<DestinyBreakerTypeDefinition>;
  DamageType: DefinitionTable<DestinyDamageTypeDefinition>;
  Collectible: DefinitionTable<DestinyCollectibleDefinition>;
  EventCard: DefinitionTable<DestinyEventCardDefinition>;
  LoadoutConstants: DefinitionTable<DestinyLoadoutConstantsDefinition>;
  LoadoutName: DefinitionTable<DestinyLoadoutNameDefinition>;
  LoadoutColor: DefinitionTable<DestinyLoadoutColorDefinition>;
  LoadoutIcon: DefinitionTable<DestinyLoadoutIconDefinition>;
  /** Check if these defs are from D2. Inside an if statement, these defs will be narrowed to type D2ManifestDefinitions. */
  readonly isDestiny2: true;
}

/**
 * Manifest database definitions. This returns a promise for an
 * object that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function getDefinitions(force = false): ThunkResult<D2ManifestDefinitions> {
  return async (dispatch, getState) => {
    let existingManifest = d2ManifestSelector(getState());
    if (existingManifest && !force) {
      return existingManifest;
    }
    const db = await dispatch(getManifest(allTables));
    existingManifest = d2ManifestSelector(getState());
    if (existingManifest && !force) {
      return existingManifest;
    }

    const defs = buildDefinitionsFromManifest(db);
    dispatch(setD2Manifest(defs));
    return defs;
  };
}

export function buildDefinitionsFromManifest(db: AllDestinyManifestComponents) {
  enhanceDBWithFakeEntries(db);
  const defs: { [table: string]: any; isDestiny2: true } = {
    isDestiny2: true,
  };

  for (const tableShort of allTables) {
    const table = `Destiny${tableShort}Definition` as const;
    const dbTable = db[table];
    if (!dbTable) {
      throw new Error(`Table ${table} does not exist in the manifest`);
    }

    defs[tableShort] = {
      get(id: number, requestor?: { hash: number } | string | number) {
        const dbEntry = dbTable[id];
        if (!dbEntry) {
          // there are valid negative hashes that we have added ourselves via enhanceDBWithFakeEntries,
          // but other than that they should be whole & reasonable sized numbers
          if (id < 1 || !Number.isSafeInteger(id)) {
            const requestingEntryInfo = typeof requestor === 'object' ? requestor.hash : requestor;
            reportException('invalidHash', new HashLookupFailure(table, id), {
              requestingEntryInfo,
              failedHash: id,
              failedComponent: table,
            });
          } else if (id !== UNSET_PLUG_HASH) {
            // an invalid hash that, in new loadouts, just means lookup should fail
            warnLogCollapsedStack('hashLookupFailure', `${table}[${id}]`, requestor);
          }
        }
        return dbEntry;
      },
      getOptional(id: number) {
        return dbTable[id];
      },
      getAll() {
        return dbTable;
      },
    };
  }

  return defs as D2ManifestDefinitions;
}

/** This adds fake entries to the DB for places where we've had to make stuff up. */
function enhanceDBWithFakeEntries(db: AllDestinyManifestComponents) {
  // We made up an item category for special grenade launchers. For now they can just be a copy
  // of the regular "Grenade Launcher" category but we could patch in localized descriptions if we wanted.
  db.DestinyItemCategoryDefinition[-ItemCategoryHashes.GrenadeLaunchers] = {
    ...db.DestinyItemCategoryDefinition[ItemCategoryHashes.GrenadeLaunchers],
  };
}
