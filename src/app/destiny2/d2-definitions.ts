import {
  DestinyActivityDefinition,
  DestinyActivityModifierDefinition,
  DestinyActivityTypeDefinition,
  DestinyClassDefinition,
  DestinyFactionDefinition,
  DestinyGenderDefinition,
  DestinyInventoryBucketDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemCategoryDefinition,
  DestinyItemTierTypeDefinition,
  DestinyMilestoneDefinition,
  DestinyObjectiveDefinition,
  DestinyProgressionDefinition,
  DestinyRaceDefinition,
  DestinySandboxPerkDefinition,
  DestinySocketCategoryDefinition,
  DestinySocketTypeDefinition,
  DestinyStatDefinition,
  DestinyEnergyTypeDefinition,
  DestinyTalentGridDefinition,
  DestinyVendorDefinition,
  DestinyDestinationDefinition,
  DestinyPlaceDefinition,
  DestinyVendorGroupDefinition,
  DestinyActivityModeDefinition,
  DestinyPlugSetDefinition,
  DestinyCollectibleDefinition,
  DestinyPresentationNodeDefinition,
  DestinyRecordDefinition,
  DestinyStatGroupDefinition,
  DestinySeasonDefinition
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { D2ManifestService } from '../manifest/manifest-service-json';
import store from '../store/store';
import { setD2Manifest } from '../manifest/actions';

const lazyTables = [
  'InventoryItem', // DestinyInventoryItemDefinition
  'Objective', // DestinyObjectiveDefinition
  'SandboxPerk', // DestinySandboxPerkDefinition
  'Stat', // DestinyStatDefinition
  'StatGroup',
  'EnergyType',
  'TalentGrid', // DestinyTalentGridDefinition
  'Progression', // DestinyProgressionDefinition
  'ItemCategory', // DestinyItemCategoryDefinition
  'Activity', // DestinyActivityDefinition
  'ActivityType', // DestinyActivityTypeDefinition
  'ActivityModifier',
  'Vendor',
  'SocketCategory',
  'SocketType',
  'Season',
  'Milestone',
  'Destination',
  'Place',
  'VendorGroup',
  'PlugSet',
  'Collectible',
  'PresentationNode',
  'Record'
];

const eagerTables = [
  'InventoryBucket', // DestinyInventoryBucketDefinition
  'Class', // DestinyClassDefinition
  'Gender', // DestinyGenderDefinition
  'Race', // DestinyRaceDefinition
  'Faction', // DestinyFactionDefinition
  'ItemTierType', // DestinyItemTierTypeDefinition
  'ActivityMode' // DestinyActivityModeDefinition
];

export interface LazyDefinition<T> {
  get(hash: number): T;
  getAll(): { [hash: number]: T };
}

export interface D2ManifestDefinitions {
  InventoryItem: LazyDefinition<DestinyInventoryItemDefinition>;
  Objective: LazyDefinition<DestinyObjectiveDefinition>;
  SandboxPerk: LazyDefinition<DestinySandboxPerkDefinition>;
  Stat: LazyDefinition<DestinyStatDefinition>;
  StatGroup: LazyDefinition<DestinyStatGroupDefinition>;
  EnergyType: LazyDefinition<DestinyEnergyTypeDefinition>;
  TalentGrid: LazyDefinition<DestinyTalentGridDefinition>;
  Progression: LazyDefinition<DestinyProgressionDefinition>;
  ItemCategory: LazyDefinition<DestinyItemCategoryDefinition>;
  Activity: LazyDefinition<DestinyActivityDefinition>;
  ActivityType: LazyDefinition<DestinyActivityTypeDefinition>;
  ActivityModifier: LazyDefinition<DestinyActivityModifierDefinition>;
  Vendor: LazyDefinition<DestinyVendorDefinition>;
  SocketCategory: LazyDefinition<DestinySocketCategoryDefinition>;
  SocketType: LazyDefinition<DestinySocketTypeDefinition>;
  Season: LazyDefinition<DestinySeasonDefinition>;
  Milestone: LazyDefinition<DestinyMilestoneDefinition>;
  Destination: LazyDefinition<DestinyDestinationDefinition>;
  Place: LazyDefinition<DestinyPlaceDefinition>;
  VendorGroup: LazyDefinition<DestinyVendorGroupDefinition>;
  PlugSet: LazyDefinition<DestinyPlugSetDefinition>;
  Collectible: LazyDefinition<DestinyCollectibleDefinition>;
  PresentationNode: LazyDefinition<DestinyPresentationNodeDefinition>;
  Record: LazyDefinition<DestinyRecordDefinition>;

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
  const defs = {};
  lazyTables.forEach((tableShort) => {
    const table = `Destiny${tableShort}Definition`;
    defs[tableShort] = {
      get(name: number) {
        return D2ManifestService.getRecord(db, table, name);
      },

      getAll() {
        return D2ManifestService.getAllRecords(db, table);
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
