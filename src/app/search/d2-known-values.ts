import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import {
  BreakerTypeHashes,
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
  StatHashes,
} from 'data/d2/generated-enums';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

//
// GAME MECHANICS KNOWN VALUES
//

export const MAX_ARMOR_ENERGY_CAPACITY = 10;

//
// SOCKETS KNOWN VALUES
//

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

/** The consistent armour 2 mod category hashes. This excludes raid, combat and legacy slots as they tend to change. */
export const armor2PlugCategoryHashes: number[] = Object.values(armor2PlugCategoryHashesByName);

export const killTrackerObjectivesByHash: Record<number, 'pvp' | 'pve' | undefined> = {
  74070459: 'pvp', // Objective "Crucible Opponents Defeated" found inside InventoryItem[38912240] "Crucible Tracker"
  1501870536: 'pvp', // Objective "Crucible Opponents Defeated" found inside InventoryItem[2285636663] "Crucible Tracker"
  2439952408: 'pvp', // Objective "Crucible Opponents Defeated" found inside InventoryItem[3244015567] "Crucible Tracker"
  73837075: 'pve', // Objective "Enemies Defeated" found inside InventoryItem[905869860] "Kill Tracker"
  90275515: 'pve', // Objective "Enemies Defeated" found inside InventoryItem[2240097604] "Kill Tracker"
  2579044636: 'pve', // Objective "Enemies Defeated" found inside InventoryItem[2302094943] "Kill Tracker"
  2285418970: undefined, //
};
export const killTrackerSocketTypeHash = 1282012138;

//
// STATS KNOWN VALUES
//

/** the stat hash for DIM's artificial armor stat, "Total" */
export const TOTAL_STAT_HASH = -1000;
export const CUSTOM_TOTAL_STAT_HASH = -1100;

/** hashes representing D2 PL stats */
export const D2LightStats = [StatHashes.Attack, StatHashes.Defense, StatHashes.Power];

/** these stats canonically exist on D2 armor */
export const D2ArmorStatHashByName = {
  mobility: StatHashes.Mobility,
  resilience: StatHashes.Resilience,
  recovery: StatHashes.Recovery,
  discipline: StatHashes.Discipline,
  intellect: StatHashes.Intellect,
  strength: StatHashes.Strength,
};

/** Stats that all (D2) armor should have. */
export const armorStats = Object.values(D2ArmorStatHashByName);

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
  swingspeed: StatHashes.SwingSpeed,
  guardefficiency: StatHashes.GuardEfficiency,
  guardresistance: StatHashes.GuardResistance,
  chargerate: StatHashes.ChargeRate,
  guardendurance: StatHashes.GuardEndurance,
  ammocapacity: StatHashes.AmmoCapacity,
};

//
// ITEMS / ITEMCATERGORY KNOWN VALUES
//

/** D2 has these item types but D1 doesn't */
export const D2ItemCategoryHashesByName = {
  grenadelauncher: ItemCategoryHashes.GrenadeLaunchers,
  specialgrenadelauncher: -153950757,
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
  73143230, // Pinnacle
  3114385605, // Tier 1
  4039143015, // Powerful
  3114385606, // Tier 2
  3114385607, // Tier 3
];

export const pinnacleSources = [
  73143230, // Pinnacle
];

//
// BUCKETS KNOWN VALUES
//

/**
 * a weird bucket for holding dummies, which items show up in only temporarily.
 *
 * see https://github.com/Bungie-net/api/issues/687
 */
export const THE_FORBIDDEN_BUCKET = 2422292810;

export const armorBuckets = {
  helmet: BucketHashes.Helmet,
  gauntlets: BucketHashes.Gauntlets,
  chest: BucketHashes.ChestArmor,
  leg: BucketHashes.LegArmor,
  classitem: BucketHashes.ClassArmor,
};

//
// PRESENTATION NODE KNOWN VALUES
//

export const RAID_NODE = 4025982223;

//
// MISC KNOWN HASHES / ENUMS
//

export const ENCOUNTERS_COMPLETED_OBJECTIVE = 1579649637;

export const ARMSMASTER_ACTIVITY_MODIFIER = 3704166961;

export const RAID_ACTIVITY_TYPE_HASH = 2043403989;

// milestones to manually mark as raid, because they don't adequately identify themselves in defs
export const RAID_MILESTONE_HASHES = [
  2712317338, // Milestone "Garden of Salvation" has no associated activities to check for raid-ness
];

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
  XUR: 2190858386,
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
  [DestinyEnergyType.Ghost]: 'ghost',
  [DestinyEnergyType.Subclass]: 'subclass',
  [DestinyEnergyType.Stasis]: 'stasis',
};

export const energyCapacityTypeNames = Object.values(energyNamesByEnum);

export const damageNamesByEnum: Record<DamageType, string | null> = {
  [DamageType.None]: null,
  [DamageType.Kinetic]: 'kinetic',
  [DamageType.Arc]: 'arc',
  [DamageType.Thermal]: 'solar',
  [DamageType.Void]: 'void',
  [DamageType.Raid]: 'raid',
  [DamageType.Stasis]: 'stasis',
};

export const breakerTypes = {
  barrier: BreakerTypeHashes.ShieldPiercing,
  antibarrier: BreakerTypeHashes.ShieldPiercing,
  shieldpiercing: BreakerTypeHashes.ShieldPiercing,
  overload: BreakerTypeHashes.Disruption,
  disruption: BreakerTypeHashes.Disruption,
  unstoppable: BreakerTypeHashes.Stagger,
  stagger: BreakerTypeHashes.Stagger,
};

export const modsWithConditionalStats = {
  powerfulFriends: 1484685887,
  radiantLight: 2979815167,
  chargeHarvester: 2263321587,
  elementalCapacitor: 3511092054,
} as const;

export const UpgradeMaterialHashes = {
  legendaryShard: 1022552290,
  enhancementPrism: 4257549984,
  ascendantShard: 4257549985,
} as const;
