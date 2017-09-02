import _ from 'underscore';

const lazyTables = [
  'Items', // DestinyInventoryItemDefinition
  'Objectives', // DestinyObjectiveDefinition
  'SandboxPerks', // DestinySandboxPerksDefinition
  'Stats', // DestinyStatDefinition
  'Talents', // DestinyTalentGridDefinition
  'Progressions', // DestinyProgressionDefinition
  'ItemCategories', // DestinyItemCategoryDefinition
  'Activities', // DestinyActivityDefinition
  'ActivityTypes' // DestinyActivityTypeDefinition
];

const eagerTables = [
  'InventoryBuckets', // DestinyInventoryBucketDefinition
  'Classes', // DestinyClassDefinition
  'Genders', // DestinyGenderDefinition
  'Races', // DestinyRaceDefinition
  'Factions', // DestinyFactionDefinition
  'ItemTierTypes' // DestinyItemTierTypeDefinition
];

/**
 * Manifest database definitions. This returns a promise for an
 * objet that has a property named after each of the tables listed
 * above (defs.TalentGrid, etc.).
 */
export function D2Definitions($q, D2ManifestService) {
  'ngInject';

  return {
    getDefinitions: _.memoize(() => {
      return $q.when(D2ManifestService.getManifest()
        .then((db) => {
          const defs = {};

          // Load objects that lazily load their properties from the sqlite DB.
          lazyTables.forEach((table) => {
            defs[table] = {
              get: function(name) {
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
          eagerTables.forEach((table) => {
            defs[table] = D2ManifestService.getAllRecords(db, table);
          });

          return defs;
        })
        .catch((e) => {
          console.error(e);
          return $q.reject(e);
        }));
    })
  };
}

