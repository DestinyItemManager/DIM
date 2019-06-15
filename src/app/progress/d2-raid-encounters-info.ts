// this translates "phase" hashes (available in the progress API)
// into Objective hashes from the raid Triumph checkboxes
// in order to localize using the progressDescription of those Objectives
// since "phase" hashes don't exist in the manifest.
// these are pulled from the "Complete as same class" triumphs for Y2 raids

export const D2RaidEncounters = {
  // Leviathan
  // "3847906370": "unknown", // unknown
  // "1431486395": "unknown", // unknown
  // "2188993306": "unknown", // unknown
  // "4231923662": "unknown", // unknown
  // "2612265741"  // "Gardens"
  // "2457589080"  // "Gauntlet"
  // "2848447175"  // "Castellum"
  // "2751096463"  // "Throne"

  // Eater of Worlds
  // "415534662":  "unknown", // unknown
  // "3813639709": "unknown", // unknown
  // "2941618871": "unknown", // unknown
  // "877738674":  "unknown", // unknown

  // Spire of Stars
  // "3864507933": "unknown", // unknown
  // "3025298087": "unknown", // unknown
  // "1245655652": "unknown", // unknown
  // "1245655655": "unknown", // unknown

  // Last Wish
  '1126840038': '2317298899', // Kalli defeated
  '1040714588': '2317298898', // Shuro Chi defeated
  '4249034918': '2317298897', // Morgeth, the Spirekeeper defeated
  '436847112': '2317298896', // Vault infiltrated
  '2392610624': '2317298903', // Riven of a Thousand Voices defeated
  'unsure----': '2317298902', // Last Wish raid completed

  // Scourge of the Past
  '566861111': '1168613809', // Berserker completed
  '244769953': '1168613808', // Vault Access completed
  '1268191778': '1168613811', // INSURRECTION PRIME defeated

  // Crown of Sorrow
  '824306255': '3036884545', // Hive ritual dispelled
  '9235511': '3036884544', // Kingdom of Sorrow infiltrated
  '3789028322': '3036884547', // Gahlran's Deception defeated
  '3307986266': '3036884546' // Gahlran, the Sorrow-Bearer defeated
};
