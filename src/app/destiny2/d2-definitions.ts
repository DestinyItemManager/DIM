import { UNSET_PLUG_HASH } from 'app/loadout/known-values';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { reportException } from 'app/utils/exceptions';
import { warnLog, warnLogCollapsedStack } from 'app/utils/log';
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
  DestinyItemTierTypeDefinition,
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
  DestinyPowerCapDefinition,
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
import { Draft } from 'immer';
import { setD2Manifest } from '../manifest/actions';
import { getManifest } from '../manifest/manifest-service-json';
import { HashLookupFailure, ManifestDefinitions } from './definitions';

type ManifestTablesShort = Exclude<keyof D2ManifestDefinitions, 'isDestiny1' | 'isDestiny2'>;

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
  'PowerCap',
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
  'ItemTierType',
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

export interface D2ManifestDefinitions extends ManifestDefinitions {
  InventoryBucket: DefinitionTable<DestinyInventoryBucketDefinition>;
  Class: DefinitionTable<DestinyClassDefinition>;
  Gender: DefinitionTable<DestinyGenderDefinition>;
  Race: DefinitionTable<DestinyRaceDefinition>;
  Faction: DefinitionTable<DestinyFactionDefinition>;
  ItemTierType: DefinitionTable<DestinyItemTierTypeDefinition>;
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
  PowerCap: DefinitionTable<DestinyPowerCapDefinition>;
  BreakerType: DefinitionTable<DestinyBreakerTypeDefinition>;
  DamageType: DefinitionTable<DestinyDamageTypeDefinition>;
  Collectible: DefinitionTable<DestinyCollectibleDefinition>;
  EventCard: DefinitionTable<DestinyEventCardDefinition>;
  LoadoutConstants: DefinitionTable<DestinyLoadoutConstantsDefinition>;
  LoadoutName: DefinitionTable<DestinyLoadoutNameDefinition>;
  LoadoutColor: DefinitionTable<DestinyLoadoutColorDefinition>;
  LoadoutIcon: DefinitionTable<DestinyLoadoutIconDefinition>;
}

/**
 * Manifest database definitions. This returns a promise for an
 * object that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function getDefinitions(): ThunkResult<D2ManifestDefinitions> {
  return async (dispatch, getState) => {
    let existingManifest = d2ManifestSelector(getState());
    if (existingManifest) {
      return existingManifest;
    }
    const db = await dispatch(getManifest(allTables));
    existingManifest = d2ManifestSelector(getState());
    if (existingManifest) {
      return existingManifest;
    }

    const defs = buildDefinitionsFromManifest(db);
    dispatch(setD2Manifest(defs));
    return defs;
  };
}

export function buildDefinitionsFromManifest(db: AllDestinyManifestComponents) {
  enhanceDBWithFakeEntries(db);
  patchDBEntriesForVeryGoodReasonsOnly(db);
  const defs: ManifestDefinitions & { [table: string]: any } = {
    isDestiny1: () => false,
    isDestiny2: () => true,
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

/**
 * Sometimes the defs just have data that DIM can't deal with for some reason. Patch
 * a very limited subset of definitions here, with the intent of hopefully removing
 * them later.
 */
function patchDBEntriesForVeryGoodReasonsOnly(db: AllDestinyManifestComponents) {
  const enhancedBipodHash = 2282937672; // InventoryItem "Bipod"
  const enhancedBipod = db.DestinyInventoryItemDefinition[enhancedBipodHash];
  if (!enhancedBipod || enhancedBipod.investmentStats?.length !== 4) {
    warnLog(
      'db entry patches',
      'enhanced bipod workaround does not apply anymore',
      enhancedBipodHash
    );
  } else {
    // Enhanced Bipod has [-25 blast radius, -15 reload speed, -30 blast radius, -20 reload speed]
    // investment stats, all conditionally active. Only the lower stats should apply, the others
    // are from the base perk and included in the defs for whatever reason. DIM really can't deal with that
    // because we map investment stats to an object keyed by stat hash and dupes break this.
    // https://github.com/DestinyItemManager/DIM/issues/9076 can fix this.
    (enhancedBipod as Draft<DestinyInventoryItemDefinition>).investmentStats.splice(-2, 2);
  }

  const enhancedLastingImpressionHash = 1167468626; // InventoryItem "Lasting Impression"
  const enhancedLastingImpression =
    db.DestinyInventoryItemDefinition[enhancedLastingImpressionHash];
  if (
    !enhancedLastingImpression ||
    enhancedLastingImpression.investmentStats?.length !== 2 ||
    enhancedLastingImpression.investmentStats[0].statTypeHash !==
      enhancedLastingImpression.investmentStats[1].statTypeHash
  ) {
    warnLog(
      'db entry patches',
      'enhanced lasting impression workaround does not apply anymore',
      enhancedLastingImpressionHash
    );
  } else {
    // Lasting Impression has two stats providing different values for the same stat that should just be added together.
    // Difficult to support in DIM for similar reasons as above.
    // https://github.com/DestinyItemManager/DIM/issues/9076 can fix this.
    const draft = enhancedLastingImpression as Draft<DestinyInventoryItemDefinition>;
    const value = draft.investmentStats.pop()!.value;
    draft.investmentStats[0].value += value;
  }
}

/** This adds fake entries to the DB for places where we've had to make stuff up. */
function enhanceDBWithFakeEntries(db: AllDestinyManifestComponents) {
  // We made up an item category for special grenade launchers. For now they can just be a copy
  // of the regular "Grenade Launcher" category but we could patch in localized descriptions if we wanted.
  db.DestinyItemCategoryDefinition[-ItemCategoryHashes.GrenadeLaunchers] = {
    ...db.DestinyItemCategoryDefinition[ItemCategoryHashes.GrenadeLaunchers],
  };
}
