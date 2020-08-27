import { DestinyEnergyType, DamageType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes, StatHashes } from 'data/d2/generated-enums';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

//
// GAME MECHANICS KNOWN VALUES
//

// mods/masterworks can't push mob/rec/res/dis/int/str above 42
export const ARMOR_STAT_CAP = 42;

//
// SOCKETS KNOWN VALUES
//

/**
 * Plugs to hide from plug options (if not socketed)
 * removes the "Default Ornament" plug, "Default Shader" and "Rework Masterwork"
 * TODO: with AWA we may want to put some of these back
 */
export const EXCLUDED_PLUGS = new Set([
  // Default ornament
  2931483505, // InventoryItem "Default Ornament"
  1959648454, // InventoryItem "Default Ornament"
  702981643, // InventoryItem "Default Ornament"
  // Rework Masterwork
  39869035, // InventoryItem "Rework Armor"
  1961001474, // InventoryItem "Rework Weapon"
  3612467353, // InventoryItem "Rework Weapon"
  // Default Shader
  4248210736, // InventoryItem "Default Shader"
]);

/** the default shader InventoryItem in every empty shader slot */
export const DEFAULT_SHADER = 4248210736; // InventoryItem "Default Shader"

/** the default glow InventoryItem in every empty glow slot */
export const DEFAULT_GLOW = 3807544519; // InventoryItem "Remove Armor Glow"

/** An array of default ornament hashes */
export const DEFAULT_ORNAMENTS: number[] = [
  2931483505, // InventoryItem "Default Ornament"
  1959648454, // InventoryItem "Default Ornament"
  702981643, // InventoryItem "Default Ornament"
];

export const UPGRADE_MASTERWORK = 3547298846; // InventoryItem "Upgrade Masterwork"

/** if a socket contains these, consider it empty */
export const emptySocketHashes = [
  2323986101, // InventoryItem "Empty Mod Socket"
  2600899007, // InventoryItem "Empty Mod Socket"
  1835369552, // InventoryItem "Empty Mod Socket"
  3851138800, // InventoryItem "Empty Mod Socket"
  791435474, // InventoryItem "Empty Activity Mod Socket"
];

export const armor2PlugCategoryHashesByName = {
  general: PlugCategoryHashes.EnhancementsV2General,
  helmet: PlugCategoryHashes.EnhancementsV2Head,
  gauntlets: PlugCategoryHashes.EnhancementsV2Arms,
  chest: PlugCategoryHashes.EnhancementsV2Chest,
  leg: PlugCategoryHashes.EnhancementsV2Legs,
  classitem: PlugCategoryHashes.EnhancementsV2ClassItem,
} as const;

export const armor2PlugCategoryHashes: number[] = Object.values(armor2PlugCategoryHashesByName);

//
// STATS KNOWN VALUES
//

/** the stat hash for DIM's artificial armor stat, "Total" */
export const TOTAL_STAT_HASH = -1000;
export const CUSTOM_TOTAL_STAT_HASH = -1100;

/** hashes representing D2 PL stats */
export const D2LightStats = [StatHashes.Attack, StatHashes.Defense];

/** these stats canonically exist on D2 armor */
export const D2ArmorStatHashByName = {
  mobility: StatHashes.Mobility,
  resilience: StatHashes.Resilience,
  recovery: StatHashes.Recovery,
  discipline: StatHashes.Discipline,
  intellect: StatHashes.Intellect,
  strength: StatHashes.Strength,
};

export const D2WeaponStatHashByName = {
  rpm: StatHashes.RoundsPerMinute,
  rof: StatHashes.RoundsPerMinute,
  charge: StatHashes.ChargeTime,
  impact: StatHashes.Impact,
  handling: StatHashes.Handling,
  range: StatHashes.Range,
  stability: StatHashes.Stability,
  reload: StatHashes.ReloadSpeed,
  magazine: StatHashes.Magazine,
  aimassist: StatHashes.AimAssistance,
  equipspeed: StatHashes.Handling,
  velocity: StatHashes.Velocity,
  blastradius: StatHashes.BlastRadius,
  recoildirection: StatHashes.RecoilDirection,
  drawtime: StatHashes.DrawTime,
  zoom: StatHashes.Zoom,
  inventorysize: StatHashes.InventorySize,
};

export const swordStatsByName = {
  swingSpeed: StatHashes.SwingSpeed,
  guardEfficiency: StatHashes.GuardEfficiency,
  guardResistance: StatHashes.GuardResistance,
  chargeRate: StatHashes.ChargeRate,
  guardEndurance: StatHashes.GuardEndurance,
  ammoCapacity: StatHashes.AmmoCapacity,
};

//
// ITEMS / ITEMCATERGORY KNOWN VALUES
//

/** D2 has these item types but D1 doesn't */
export const D2ItemCategoryHashesByName = {
  grenadelauncher: ItemCategoryHashes.GrenadeLaunchers,
  tracerifle: ItemCategoryHashes.TraceRifles,
  linearfusionrifle: ItemCategoryHashes.LinearFusionRifles,
  submachine: ItemCategoryHashes.SubmachineGuns,
  smg: ItemCategoryHashes.SubmachineGuns,
  bow: ItemCategoryHashes.Bows,
  transmat: ItemCategoryHashes.ShipModsTransmatEffects,
  weaponmod: ItemCategoryHashes.WeaponMods,
  armormod: ItemCategoryHashes.ArmorMods,
  reptoken: ItemCategoryHashes.ReputationTokens,
};

// these specific items have socket display exceptions. see ItemSockets.tsx
// review the need for this after season 12 starts
export const synthesizerHashes = [1160544508, 1160544509, 1160544511, 3633698719];
export const CHALICE_OF_OPULENCE = 1115550924;

/** powerful rewards listed in quests or bounties */
// TODO: generate in d2ai
export const powerfulSources = [
  993006552, // InventoryItem "Luminous Crucible Engram"
  1204101093, // InventoryItem "Luminous Vanguard Engram"
  1800172820, // InventoryItem "Luminous Vanguard Engram"
  2481239683, // InventoryItem "Luminous Vanguard Engram"
  2484791497, // InventoryItem "Luminous Planetary Engram"
  2558839803, // InventoryItem "Luminous Planetary Engram"
  2566956006, // InventoryItem "Luminous Crucible Engram"
  2646629159, // InventoryItem "Luminous Engram"
  2770239081, // InventoryItem "Luminous Crucible Engram"
  3829523414, // InventoryItem "Luminous Planetary Engram"
  4143344829, // InventoryItem "Luminous Engram"
  4039143015, // InventoryItem "Powerful Gear"
  4249081773, // InventoryItem "Powerful Armor"
];

//
// BUCKETS KNOWN VALUES
//

/** a weird bucket for holding dummies, which items show up in only temporarily */
export const THE_FORBIDDEN_BUCKET = 2422292810;

export const SHADERS_BUCKET = 2973005342;
export const SUBCLASS_BUCKET = 3284755031;
export const ENGRAMS_BUCKET = 375726501;
export const MODIFICATIONS_BUCKET = 3313201758;
export const CONSUMABLES_BUCKET = 1469714392;
export const MATERIALS_BUCKET = 3865314626;
export const SEASONAL_ARTIFACT_BUCKET = 1506418338;
export const FINISHERS_BUCKET = 3683254069;

export const armorBuckets = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  leg: 20886954,
  classitem: 1585787867,
};

//
// PRESENTATION NODE KNOWN VALUES
//

export const TRIUMPHS_ROOT_NODE = 1024788583;
export const SEALS_ROOT_NODE = 1652422747;
export const CATALYSTS_ROOT_NODE = 1111248994;
export const RAID_NODE = 2975760062;

//
// MISC KNOWN VALUES
//

export const ENCOUNTERS_COMPLETED_OBJECTIVE = 3133307686;

export const ARMSMASTER_ACTIVITY_MODIFIER = 3704166961;

export const TRACTION_PERK = 1818103563;

// unfortunately the API's raid .order attribute is odd
export const raidOrder = [
  3660836525, // levi
  2986584050, // eow
  2683538554, // sos
  3181387331, // wish
  1342567285, // scourge
  2590427074, // crown
];

/** used for checking if something is a raid */
export const RAID_ACTIVITY_TYPE = 2043403989;

export const VENDORS = {
  /** "The Spider", from whom we calculate planetmat info */
  SPIDER: 863940356,
  EVERVERSE: 3361454721,
  BENEDICT: 1265988377,
  BANSHEE: 672118013,
  DRIFTER: 248695599,
  ADA: 2917531897,
  /** rahool. we override how his vendor FakeItems are displayed */
  RAHOOL: 2255782930,
  VAULT: 1037843411,
};

/** used to snag the icon for display */
export const WELL_RESTED_PERK = 2352765282;

/** an "All" trait we want to filter out of trait lists */
export const ALL_TRAIT = 1434215347;

export const energyNamesByEnum: Record<DestinyEnergyType, string> = {
  [DestinyEnergyType.Any]: 'any',
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void',
};
export const energyCapacityTypeNames = Object.values(energyNamesByEnum);

export const damageNamesByEnum: Record<DamageType, string | null> = {
  [DamageType.None]: null,
  [DamageType.Kinetic]: 'kinetic',
  [DamageType.Arc]: 'arc',
  [DamageType.Thermal]: 'solar',
  [DamageType.Void]: 'void',
  [DamageType.Raid]: 'raid',
};

export const breakerTypes = {
  barrier: 485622768,
  antibarrier: 485622768,
  shieldpiercing: 485622768,
  overload: 2611060930,
  disruption: 2611060930,
  unstoppable: 3178805705,
  stagger: 3178805705,
};

export const powerCapPlugSetHash = 573;

export const MAX_ARMOR_ENERGY_CAPACITY = 10;
