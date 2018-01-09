import * as _ from 'underscore';
import { DestinyInventoryItemDefinition, DestinyItemCategoryDefinition, DestinyActivityDefinition, DestinyActivityTypeDefinition, DestinyObjectiveDefinition, DestinySandboxPerkDefinition, DestinyStatDefinition, DestinyTalentGridDefinition, DestinyProgressionDefinition, DestinyInventoryBucketDefinition, DestinyClassDefinition, DestinyGenderDefinition, DestinyRaceDefinition, DestinyFactionDefinition, DestinyItemTierTypeDefinition, DestinyMilestoneDefinition, DestinyVendorDefinition, DestinySocketCategoryDefinition, DestinySocketTypeDefinition } from 'bungie-api-ts/destiny2';
import { IPromise } from 'angular';

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
  'Vendor',
  'SocketCategory',
  'SocketType',
  'Milestone'
];

const eagerTables = [
  'InventoryBucket', // DestinyInventoryBucketDefinition
  'Class', // DestinyClassDefinition
  'Gender', // DestinyGenderDefinition
  'Race', // DestinyRaceDefinition
  'Faction', // DestinyFactionDefinition
  'ItemTierType' // DestinyItemTierTypeDefinition
];

export interface LazyDefinition<T> {
  get(hash: number): T;
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
  Vendor: LazyDefinition<DestinyVendorDefinition>;
  SocketCategory: LazyDefinition<DestinySocketCategoryDefinition>;
  SocketType: LazyDefinition<DestinySocketTypeDefinition>;
  Milestone: LazyDefinition<DestinyMilestoneDefinition>;

  InventoryBucket: { [hash: number]: DestinyInventoryBucketDefinition };
  Class: { [hash: number]: DestinyClassDefinition };
  Gender: { [hash: number]: DestinyGenderDefinition };
  Race: { [hash: number]: DestinyRaceDefinition };
  Faction: { [hash: number]: DestinyFactionDefinition };
  ItemTierType: { [hash: number]: DestinyItemTierTypeDefinition };
}

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export interface D2DefinitionsService {
  getDefinitions(): IPromise<D2ManifestDefinitions>;
}

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function D2Definitions($q, D2ManifestService): D2DefinitionsService {
  'ngInject';

  const getDefinitions: () => IPromise<D2ManifestDefinitions> = () => {
    return $q.when(D2ManifestService.getManifest()
      .then((db) => {
        const defs = {};

        // Load objects that lazily load their properties from the sqlite DB.
        lazyTables.forEach((tableShort) => {
          const table = `Destiny${tableShort}Definition`;
          defs[tableShort] = {
            get(name) {
              if (this.hasOwnProperty(name)) {
                return this[name];
              }
              const val = D2ManifestService.getRecord(db, table, name);
              this[name] = val;
              return val;
            }
          };
        });

        // Resources that need to be fully loaded (because they're iterated over)
        eagerTables.forEach((tableShort) => {
          const table = `Destiny${tableShort}Definition`;
          defs[tableShort] = D2ManifestService.getAllRecords(db, table);
        });

        return defs;
      })
      .catch((e) => {
        console.error(e);
        return $q.reject(e);
      }));
  };

  return {
    getDefinitions: _.memoize(getDefinitions) as () => IPromise<D2ManifestDefinitions>
  };
}
