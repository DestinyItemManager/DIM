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
  DestinyVendorGroupDefinition
} from 'bungie-api-ts/destiny2';

import { D2ManifestService } from '../manifest/manifest-service-json';
import { ManifestDefinitions } from './definitions';
import _ from 'lodash';
import { setD2Manifest } from '../manifest/actions';
import store from '../store/store';

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
  'Trait'
];

const eagerTables = [
  'InventoryBucket',
  'Class',
  'Gender',
  'Race',
  'Faction',
  'ItemTierType',
  'ActivityMode'
];

/** These aren't really lazy */
export interface DefinitionTable<T> {
  get(hash: number): T;
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
  Collectible: DefinitionTable<DestinyCollectibleDefinition>;
  PresentationNode: DefinitionTable<DestinyPresentationNodeDefinition>;
  Record: DefinitionTable<DestinyRecordDefinition>;
  Metric: DefinitionTable<DestinyMetricDefinition>;
  Trait: DefinitionTable<DestinyTraitDefinition>;
  DamageType: DefinitionTable<DestinyDamageTypeDefinition>;

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
export const getDefinitions = _.once(getDefinitionsUncached);

/**
 * Manifest database definitions. This returns a promise for an
 * object that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
async function getDefinitionsUncached() {
  const db = await D2ManifestService.getManifest([...eagerTables, ...lazyTables]);
  const defs = {
    isDestiny1: () => false,
    isDestiny2: () => true
  };
  lazyTables.forEach((tableShort) => {
    const table = `Destiny${tableShort}Definition`;
    defs[tableShort] = {
      get(name: number) {
        return D2ManifestService.getRecord(db, table, name);
      }
    };
  });
  // Resources that need to be fully loaded (because they're iterated over)
  eagerTables.forEach((tableShort) => {
    const table = `Destiny${tableShort}Definition`;
    defs[tableShort] = D2ManifestService.getAllRecords(db, table);
  });
  store.dispatch(setD2Manifest(defs as D2ManifestDefinitions));
  D2ManifestService.loaded = true;
  return defs as D2ManifestDefinitions;
}
