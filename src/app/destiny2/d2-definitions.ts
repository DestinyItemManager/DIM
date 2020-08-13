import {
  DestinyActivityDefinition,
  DestinyActivityModeDefinition,
  DestinyActivityModifierDefinition,
  DestinyClassDefinition,
  DestinyCollectibleDefinition,
  DestinyDamageTypeDefinition,
  DestinyDestinationDefinition,
  DestinyEnergyTypeDefinition,
  DestinyFactionDefinition,
  DestinyGenderDefinition,
  DestinyInventoryBucketDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemCategoryDefinition,
  DestinyItemTierTypeDefinition,
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
  DestinyTalentGridDefinition,
  DestinyTraitDefinition,
  DestinyVendorDefinition,
  DestinyVendorGroupDefinition,
  DestinyPowerCapDefinition,
  DestinyBreakerTypeDefinition,
} from 'bungie-api-ts/destiny2';

import { getManifest } from '../manifest/manifest-service-json';
import { ManifestDefinitions } from './definitions';
import _ from 'lodash';
import { setD2Manifest } from '../manifest/actions';
import { reportException } from 'app/utils/exceptions';
import { ThunkResult } from 'app/store/types';

const lazyTables = [
  'InventoryItem',
  'Objective',
  'SandboxPerk',
  'Stat',
  'StatGroup',
  'EnergyType',
  'DamageType',
  'TalentGrid',
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
  'PowerCap',
  'BreakerType',
];

const eagerTables = [
  'InventoryBucket',
  'Class',
  'Gender',
  'Race',
  'Faction',
  'ItemTierType',
  'ActivityMode',
];

/** These aren't really lazy */
export interface DefinitionTable<T> {
  /**
   * for troubleshooting/questionable lookups, include second arg
   * and sentry can gather info about the source of the invalid hash.
   * `requestor` ideally a string/number, or a definition including a "hash" key
   */
  get(hash: number, requestor?: any): T;
  getAll(): { [hash: number]: T };
}

export interface D2ManifestDefinitions extends ManifestDefinitions {
  InventoryItem: DefinitionTable<DestinyInventoryItemDefinition>;
  Objective: DefinitionTable<DestinyObjectiveDefinition>;
  SandboxPerk: DefinitionTable<DestinySandboxPerkDefinition>;
  Stat: DefinitionTable<DestinyStatDefinition>;
  StatGroup: DefinitionTable<DestinyStatGroupDefinition>;
  EnergyType: DefinitionTable<DestinyEnergyTypeDefinition>;
  TalentGrid: DefinitionTable<DestinyTalentGridDefinition>;
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
  PowerCap: DefinitionTable<DestinyPowerCapDefinition>;
  BreakerType: DefinitionTable<DestinyBreakerTypeDefinition>;
  DamageType: DefinitionTable<DestinyDamageTypeDefinition>;
  Collectible: DefinitionTable<DestinyCollectibleDefinition>;

  InventoryBucket: { [hash: number]: DestinyInventoryBucketDefinition };
  Class: { [hash: number]: DestinyClassDefinition };
  Gender: { [hash: number]: DestinyGenderDefinition };
  Race: { [hash: number]: DestinyRaceDefinition };
  Faction: { [hash: number]: DestinyFactionDefinition };
  ItemTierType: { [hash: number]: DestinyItemTierTypeDefinition };
  ActivityMode: { [hash: number]: DestinyActivityModeDefinition };
}

/**
 * Manifest database definitions. This returns a promise for an
 * object that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function getDefinitions(): ThunkResult<D2ManifestDefinitions> {
  return async (dispatch, getState) => {
    let existingManifest = getState().manifest.d2Manifest;
    if (existingManifest) {
      return existingManifest;
    }
    const db = await dispatch(getManifest([...eagerTables, ...lazyTables]));
    existingManifest = getState().manifest.d2Manifest;
    if (existingManifest) {
      return existingManifest;
    }
    const defs = {
      isDestiny1: () => false,
      isDestiny2: () => true,
    };
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
              `hashLookupFailure: ${table}[${id}]`,
              new Error(`hashLookupFailure: ${table}[${id}]`),
              {
                requestingEntryInfo,
                failedHash: id,
                failedComponent: table,
              }
            );
          }
          return dbEntry;
        },
        getAll() {
          return db[table];
        },
      };
    });
    // Resources that need to be fully loaded (because they're iterated over)
    eagerTables.forEach((tableShort) => {
      const table = `Destiny${tableShort}Definition`;
      defs[tableShort] = db[table];
    });

    dispatch(setD2Manifest(defs as D2ManifestDefinitions));
    return defs as D2ManifestDefinitions;
  };
}
