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
  DestinyTalentGridDefinition,
  DestinyVendorDefinition,
  DestinyDestinationDefinition,
  DestinyPlaceDefinition,
  DestinyVendorGroupDefinition,
  DestinyActivityModeDefinition,
  DestinyPlugSetDefinition,
  DestinyCollectibleDefinition,
  DestinyPresentationNodeDefinition,
  DestinyRecordDefinition
} from 'bungie-api-ts/destiny2';
import * as _ from 'lodash';
import { D2ManifestService } from '../manifest/manifest-service-json';

const lazyTables = [
  'InventoryItem', // DestinyInventoryItemDefinition
  'Objective', // DestinyObjectiveDefinition
  'SandboxPerk', // DestinySandboxPerkDefinition
  'Stat', // DestinyStatDefinition
  'TalentGrid', // DestinyTalentGridDefinition
  'Progression', // DestinyProgressionDefinition
  'ItemCategory', // DestinyItemCategoryDefinition
  'Activity', // DestinyActivityDefinition
  'ActivityType', // DestinyActivityTypeDefinition
  'ActivityModifier',
  'Vendor',
  'SocketCategory',
  'SocketType',
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
  TalentGrid: LazyDefinition<DestinyTalentGridDefinition>;
  Progression: LazyDefinition<DestinyProgressionDefinition>;
  ItemCategory: LazyDefinition<DestinyItemCategoryDefinition>;
  Activity: LazyDefinition<DestinyActivityDefinition>;
  ActivityType: LazyDefinition<DestinyActivityTypeDefinition>;
  ActivityModifier: LazyDefinition<DestinyActivityModifierDefinition>;
  Vendor: LazyDefinition<DestinyVendorDefinition>;
  SocketCategory: LazyDefinition<DestinySocketCategoryDefinition>;
  SocketType: LazyDefinition<DestinySocketTypeDefinition>;
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
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export const getDefinitions = _.once(getDefinitionsUncached);

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
async function getDefinitionsUncached() {
  const db = await D2ManifestService.getManifest([...eagerTables, ...lazyTables]);
  const defs = {};
  // Load objects that lazily load their properties from the sqlite DB.
  lazyTables.forEach((tableShort) => {
    const table = `Destiny${tableShort}Definition`;
    defs[tableShort] = {
      get(name: number) {
        if (this.hasOwnProperty(name)) {
          return this[name];
        }
        const val = D2ManifestService.getRecord(db, table, name);
        this[name] = val;
        return val;
      },

      getAll: _.once(function() {
        const allRecords = D2ManifestService.getAllRecords(db, table);
        // Cache all the results individually
        Object.assign(this, allRecords);
        return allRecords;
      })
    };
  });
  // Resources that need to be fully loaded (because they're iterated over)
  eagerTables.forEach((tableShort) => {
    const table = `Destiny${tableShort}Definition`;
    defs[tableShort] = D2ManifestService.getAllRecords(db, table);
  });
  return defs as D2ManifestDefinitions;
}
