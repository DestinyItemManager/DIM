import { DestinyEnergyType, DamageType } from 'bungie-api-ts/destiny2';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

/** hashes representing D2 PL stats */
export const D2LightStats = [
  1480404414, // Attack
  3897883278, // Defense
];

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

/** if a plug contains these, consider it empty */
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

export const shaderBucket = 2973005342;

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

export const Armor2ModPlugCategories = {
  general: 2487827355,
  helmet: 2912171003,
  gauntlets: 3422420680,
  chest: 1526202480,
  leg: 2111701510,
  classitem: 912441879,
} as const;

export const breakerTypes = {
  barrier: 485622768,
  antibarrier: 485622768,
  shieldpiercing: 485622768,
  overload: 2611060930,
  disruption: 2611060930,
  unstoppable: 3178805705,
  stagger: 3178805705,
};
