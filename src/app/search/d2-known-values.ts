import { DestinyEnergyType, DamageType } from 'bungie-api-ts/destiny2';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

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
  2931483505,
  1959648454,
  702981643,
  // Rework Masterwork
  39869035,
  1961001474,
  3612467353,
  // Default Shader
  4248210736,
]);

/** The item category hash for "intrinsic perk" */
export const INTRINSIC_ITEM_CATEGORY = 2237038328;
/** The plug category hash for "intrinsic perk" */
export const INTRINSIC_PLUG_CATEGORY = 1744546145;
/** The socket category hash for holding intrinsic perks */
export const INTRINSIC_TRAITS_SOCKET_CATEGORY = 3956125808;

/** The item category hash for "masterwork mods" */
export const MASTERWORK_MOD_CATEGORY = 141186804;
/** The item category hash for "ghost projections" */
export const GHOST_MOD_CATEGORY = 1404791674;

/** the default shader InventoryItem in every empty shader slot */
export const DEFAULT_SHADER = 4248210736;

/** the default glow InventoryItem in every empty glow slot */
export const DEFAULT_GLOW = 3807544519;
/** The item category hash for "glows" */
export const DEFAULT_GLOW_CATEGORY = 1875601085;

/** An array of default ornament hashes */
export const DEFAULT_ORNAMENTS: number[] = [2931483505, 1959648454, 702981643];

export const MOD_CATEGORY = 59;
export const WEAPON_GAMEPLAY_MODS_CATEGORY = 945330047;
export const WEAPON_MODS_CATEGORY = 610365472;
export const BONUS_MODS_CATEGORY = 303512563;

export const ARMOR_MODS_CATEGORY = 4104513227;
export const Y1_ARMOR_MODS_PLUG_CATEGORY = 3347429529;

export const GHOST_PERKS_CATEGORY = 4176831154;

export const WEAPON_ORNAMENTS = 3124752623;
// the "upgrade masterwork" plug item
export const UPGRADE_MASTERWORK = 3547298846;

/** plugCategoryHash for the type of masterwork that tracks your PVE kills */
export const VANGUARD_MASTERWORK_PCH = 2109207426;

/** if a socket contains these, consider it empty */
export const emptySocketHashes = [
  2323986101, // InventoryItem "Empty Mod Socket"
  2600899007, // InventoryItem "Empty Mod Socket"
  1835369552, // InventoryItem "Empty Mod Socket"
  3851138800, // InventoryItem "Empty Mod Socket"
  791435474, // InventoryItem "Empty Activity Mod Socket"
];

/** these are checked against default rolls to determine if something's curated */
export const curatedPlugsAllowList = [
  7906839, // frames
  683359327, // guards
  1041766312, // blades
  1202604782, // tubes
  1257608559, // arrows
  1757026848, // batteries
  1806783418, // magazines
  2619833294, // scopes
  2718120384, // magazines_gl
  2833605196, // barrels
  3809303875, // bowstring
];

export const armor2PlugCategoryHashesByName = {
  general: 2487827355,
  helmet: 2912171003,
  gauntlets: 3422420680,
  chest: 1526202480,
  leg: 2111701510,
  classitem: 912441879,
} as const;

export const armor2PlugCategoryHashes: number[] = Object.values(armor2PlugCategoryHashesByName);

//
// STATS KNOWN VALUES
//

/** the stat hash for DIM's artificial armor stat, "Total" */
export const TOTAL_STAT_HASH = -1000;

/** a weapon would have this */
export const ATTACK_STAT = 1480404414;
/** a piece of armor would have this */
export const DEFENSE_STAT = 3897883278;

/** hashes representing D2 PL stats */
export const D2LightStats = [ATTACK_STAT, DEFENSE_STAT];

/** these stats canonically exist on D2 armor */
export const D2ArmorStatHashByName = {
  mobility: 2996146975,
  resilience: 392767087,
  recovery: 1943323491,
  discipline: 1735777505,
  intellect: 144602215,
  strength: 4244567218,
};

export const D2WeaponStatHashByName = {
  rpm: 4284893193, // Stat "Rounds Per Minute"
  rof: 4284893193, // Stat "Rounds Per Minute"
  charge: 2961396640, // Stat "Charge Time"
  impact: 4043523819, // Stat "Impact"
  handling: 943549884, // Stat "Handling"
  range: 1240592695, // Stat "Range"
  stability: 155624089, // Stat "Stability"
  reload: 4188031367, // Stat "Reload Speed"
  magazine: 3871231066, // Stat "Magazine"
  aimassist: 1345609583, // Stat "Aim Assistance"
  equipspeed: 943549884, // Stat "Handling"
  velocity: 2523465841, // Stat "Velocity"
  blastradius: 3614673599, // Stat "Blast Radius"
  recoildirection: 2715839340, // Stat "Recoil Direction"
  drawtime: 447667954, // Stat "Draw Time"
  zoom: 3555269338, // Stat "Zoom"
  inventorysize: 1931675084, // Stat "Inventory Size"
};

export const swordStats = {
  swingSpeed: 2837207746, // Swing Speed (sword)
  guardEfficiency: 2762071195, // Efficiency (sword)
  guardResistance: 209426660, // Defense (sword)
  chargeRate: 3022301683, // Charge Rate (Sword)
  guardEndurance: 3736848092, // Guard Endurance
  ammoCapacity: 925767036, // Ammo Capacity
};

export const ACCURACY = 1591432999; // Accuracy
export const RECOIL_DIRECTION = D2WeaponStatHashByName.recoildirection;
export const POWER_STAT = 1935470627;

//
// ITEMS / ITEMCATERGORY KNOWN VALUES
//

/** D2 has these item types but D1 doesn't */
export const D2ItemCategoryHashes = {
  grenadelauncher: 153950757,
  tracerifle: 2489664120,
  linearfusionrifle: 1504945536,
  submachine: 3954685534,
  bow: 3317538576,
  transmat: 208981632,
  weaponmod: 610365472,
  armormod: 4104513227,
  reptoken: 2088636411,
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

/** "The Spider", from whom we calculate planetmat info */
export const SPIDER_VENDOR = 863940356;
/** rahool. we override how his vendor FakeItems are displayed */
export const RAHOOL_VENDOR = 2255782930;

/** an "All" trait we want to filter out of trait lists */
export const ALL_TRAIT = 1434215347;

export const energyNamesByEnum: { [key in DestinyEnergyType]: string } = {
  [DestinyEnergyType.Any]: 'any',
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void',
};
export const energyCapacityTypeNames = Object.values(energyNamesByEnum);

export const damageNamesByEnum: { [key in DamageType]: string | null } = {
  0: null,
  1: 'kinetic',
  2: 'arc',
  3: 'solar',
  4: 'void',
  5: 'raid',
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
