import { CustomStatWeights } from '@destinyitemmanager/dim-api-types';
import { HashLookup } from 'app/utils/util-types';
import { TierType } from 'bungie-api-ts/destiny2';

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

export const d2MissingIcon = '/img/misc/missing_icon_d2.png';

//
// GAME MECHANICS KNOWN VALUES
//

export const MAX_ARMOR_ENERGY_CAPACITY = 10;
export const MASTERWORK_ARMOR_STAT_BONUS = 2;

//
// SOCKETS KNOWN VALUES
//

/** the default shader InventoryItem in every empty shader slot */
export const DEFAULT_SHADER = 4248210736; // InventoryItem "Default Shader"

/** the default glow InventoryItem in every empty glow slot */
export const DEFAULT_GLOW = 3807544519; // InventoryItem "Remove Armor Glow"

/** An array of default ornament hashes */
export const DEFAULT_ORNAMENTS: number[] = [
  2931483505, // InventoryItem "Default Ornament" Restores your weapon to its default appearance.
  1959648454, // InventoryItem "Default Ornament" Restores your weapon to its default appearance.
  702981643, // InventoryItem "Default Ornament" Restores your armor to its default appearance.
];

/** a weird set of 3 solstice ornaments that provide a single resilience stat point */
export const statfulOrnaments = [4245469491, 2978747767, 2287277682];

/** if a socket contains these, consider it empty */
export const emptySocketHashes = [
  2323986101, // InventoryItem "Empty Mod Socket"
  2600899007, // InventoryItem "Empty Mod Socket"
  1835369552, // InventoryItem "Empty Mod Socket"
  3851138800, // InventoryItem "Empty Mod Socket"
  791435474, // InventoryItem "Empty Activity Mod Socket"
];

export const armor2PlugCategoryHashesByName = {
  helmet: PlugCategoryHashes.EnhancementsV2Head,
  gauntlets: PlugCategoryHashes.EnhancementsV2Arms,
  chest: PlugCategoryHashes.EnhancementsV2Chest,
  leg: PlugCategoryHashes.EnhancementsV2Legs,
  classitem: PlugCategoryHashes.EnhancementsV2ClassItem,
  general: PlugCategoryHashes.EnhancementsV2General,
} as const;

/** The consistent armour 2 mod category hashes. This excludes raid, combat and legacy slots as they tend to change. */
export const armor2PlugCategoryHashes: number[] = Object.values(armor2PlugCategoryHashesByName);

export const killTrackerObjectivesByHash: HashLookup<'pvp' | 'pve' | 'gambit'> = {
  1501870536: 'pvp', // Objective "Crucible Opponents Defeated" inside 2285636663 "Crucible Tracker"
  2439952408: 'pvp', // Objective "Crucible Opponents Defeated" inside 3244015567 "Crucible Tracker"
  74070459: 'pvp', // Objective "Crucible Opponents Defeated" inside 38912240 "Crucible Tracker"
  890482414: 'pvp', // Objective "Crucible opponents defeated" inside 1187045864 "Crucible Memento Tracker"
  90275515: 'pve', // Objective "Enemies Defeated" inside 2240097604 "Kill Tracker"
  2579044636: 'pve', // Objective "Enemies Defeated" inside 2302094943 "Kill Tracker"
  73837075: 'pve', // Objective "Enemies Defeated" inside 905869860 "Kill Tracker"
  345540971: 'gambit', // Objective "Gambit targets defeated" inside 3915764593 "Gambit Memento Tracker"
  3387796140: 'pve', // Objective "Nightfall combatants defeated" inside 3915764594 "Nightfall Memento Tracker"
  2109364169: 'pvp', // Objective "Trials opponents defeated" inside 3915764595 "Trials Memento Tracker"
};
export const killTrackerSocketTypeHash = 1282012138;

export const weaponMasterworkY2SocketTypeHash = 2218962841;

export const enum GhostActivitySocketTypeHashes {
  /* Available once the Ghost shell has been fully Masterworked. */
  Locked = 456763785, // SocketType "Activity Ghost Mod"
  /* Activity mods provide additional currency and material rewards in various activities. */
  Unlocked = 2899644539, // SocketType "Activity Ghost Mod"
}

//
// STATS KNOWN VALUES
//

/** the stat hash for DIM's artificial armor stat, "Total" */
export const TOTAL_STAT_HASH = -1000;
export const CUSTOM_TOTAL_STAT_HASH = -111000;

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
} as const;

/** Stats that all (D2) armor should have. */
export const armorStats = Object.values(D2ArmorStatHashByName);

// a set of base stat weights, all worth the same, "switched on"
export const evenStatWeights = /* @__PURE__ */ armorStats.reduce<CustomStatWeights>(
  (o, statHash) => ({ ...o, [statHash]: 1 }),
  {},
);

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
  shieldduration: StatHashes.ShieldDuration,
  velocity: StatHashes.Velocity,
  blastradius: StatHashes.BlastRadius,
  recoildirection: StatHashes.RecoilDirection,
  drawtime: StatHashes.DrawTime,
  zoom: StatHashes.Zoom,
  airborne: StatHashes.AirborneEffectiveness,
  accuracy: StatHashes.Accuracy,
};

export const D2PlugCategoryByStatHash = {
  [StatHashes.Accuracy]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatAccuracy,
  [StatHashes.BlastRadius]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatBlastRadius,
  [StatHashes.ChargeTime]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatChargeTime,
  [StatHashes.Impact]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatDamage,
  [StatHashes.DrawTime]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatDrawTime,
  [StatHashes.Handling]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatHandling,
  [StatHashes.Speed]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatProjectileSpeed,
  [StatHashes.Range]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatRange,
  [StatHashes.ReloadSpeed]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatReload,
  [StatHashes.Stability]: PlugCategoryHashes.V400PlugsWeaponsMasterworksStatStability,
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
  heavygrenadelauncher: ItemCategoryHashes.GrenadeLaunchers,
  specialgrenadelauncher: -ItemCategoryHashes.GrenadeLaunchers,
  tracerifle: ItemCategoryHashes.TraceRifles,
  linearfusionrifle: ItemCategoryHashes.LinearFusionRifles,
  submachine: ItemCategoryHashes.SubmachineGuns,
  bow: ItemCategoryHashes.Bows,
  glaive: ItemCategoryHashes.Glaives,
  transmat: ItemCategoryHashes.ShipModsTransmatEffects,
  weaponmod: ItemCategoryHashes.WeaponMods,
  armormod: ItemCategoryHashes.ArmorMods,
  reptoken: ItemCategoryHashes.ReputationTokens,
};

export const pinnacleSources = [
  73143230, // InventoryItem "Pinnacle Gear"
];

/** The premium Eververse currency */
export const silverItemHash = 3147280338; // InventoryItem "Silver"

// Deepsight harmonizer currency for extracting weapon patterns
export const DEEPSIGHT_HARMONIZER = 2228452164;

// For loadout mods obliterated from the defs, we instead return this def
export const deprecatedPlaceholderArmorModHash = 3947616002; // InventoryItem "Deprecated Armor Mod"

//
// BUCKETS KNOWN VALUES
//

/**
 * a weird bucket for holding dummies, which items show up in only temporarily.
 *
 * see https://github.com/Bungie-net/api/issues/687
 */
export const THE_FORBIDDEN_BUCKET = 2422292810;

/** FOTL shrouded pages end up in here, for some reason */
export const SOME_OTHER_DUMMY_BUCKET = 3621873013;

// these aren't really normal equipment,
// like you can have 1 equipped but it's glued to the character.
// this array is used to prevent them from
// having normal equipment sidecar buttons
export const uniqueEquipBuckets = [
  BucketHashes.SeasonalArtifact,
  BucketHashes.Emotes,
  BucketHashes.Finishers,
];

//
// PRESENTATION NODE KNOWN VALUES
//

export const RAID_NODE = 4025982223; // PresentationNode "Raids"
export const SHADER_NODE = 1516796296; // PresentationNode "Shaders"
export const ARMOR_NODE = 1605042242; // PresentationNode "Armor"

/** Just to grab the string Universal Ornaments */
export const UNIVERSAL_ORNAMENTS_NODE = 3655910122; // PresentationNode "Universal Ornaments"

/** The emblem metrics Account parent node, used as a fallback for orphaned metrics */
export const METRICS_ACCOUNT_NODE = 2875839731; // PresentationNode "Account"

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

export const enum VendorHashes {
  Eververse = 3361454721,
  Benedict = 1265988377,
  Banshee = 672118013,
  Drifter = 248695599,
  AdaForge = 2917531897,
  AdaTransmog = 350061650,
  /** rahool. we override how his vendor FakeItems are displayed */
  Rahool = 2255782930,
  Vault = 1037843411,
  Xur = 2190858386,
  DevrimKay = 396892126,
  Failsafe = 1576276905,
  RivensWishesExotics = 2388521577,
  XurLegendaryItems = 3751514131, // Vendor "Strange Gear Offers"
}

// See coreSettingsLoaded reducer action for details. And remove this if/when we no longer perform that hack.
export const unadvertisedResettableVendors = [
  198624022, // Progression "Clan Reputation"
  784742260, // Progression "Engram Ensiders"
  2411069437, // Progression "Xûr Rank"
];

/** used to snag the icon for display */
export const WELL_RESTED_PERK = 1519921522; // SandboxPerk "Well-Rested"

/**
 * Maps TierType to tierTypeName in English and vice versa.
 * The Bungie.net version of this enum is not representative of real game strings.
 */
// A manually constructed bi-directional enum,
// because the `enum` keyword unfortunately returns type `string`.
export const D2ItemTiers = {
  Unknown: TierType.Unknown,
  [TierType.Unknown]: 'Unknown',
  Currency: TierType.Currency,
  [TierType.Currency]: 'Currency',
  Common: TierType.Basic,
  [TierType.Basic]: 'Common',
  Uncommon: TierType.Common,
  [TierType.Common]: 'Uncommon',
  Rare: TierType.Rare,
  [TierType.Rare]: 'Rare',
  Legendary: TierType.Superior,
  [TierType.Superior]: 'Legendary',
  Exotic: TierType.Exotic,
  [TierType.Exotic]: 'Exotic',
} as const;

export type ItemTierName =
  | 'Unknown'
  | 'Currency'
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Legendary'
  | 'Exotic';

export const breakerTypes = {
  any: [BreakerTypeHashes.Stagger, BreakerTypeHashes.Disruption, BreakerTypeHashes.ShieldPiercing],
  antibarrier: [BreakerTypeHashes.ShieldPiercing],
  shieldpiercing: [BreakerTypeHashes.ShieldPiercing],
  barrier: [BreakerTypeHashes.ShieldPiercing],
  disruption: [BreakerTypeHashes.Disruption],
  overload: [BreakerTypeHashes.Disruption],
  stagger: [BreakerTypeHashes.Stagger],
  unstoppable: [BreakerTypeHashes.Stagger],
};

export const breakerTypeNames = Object.entries(breakerTypes)
  .filter(([, hashes]) => hashes.length === 1)
  .reduce<Partial<Record<BreakerTypeHashes, string>>>((memo, [name, [hash]]) => {
    memo[hash] = name;
    return memo;
  }, {});

export const enum ModsWithConditionalStats {
  ElementalCapacitor = 3511092054, // InventoryItem "Elemental Capacitor"
  EchoOfPersistence = 2272984671, // InventoryItem "Echo of Persistence"
  EnhancedElementalCapacitor = 711234314, // InventoryItem "Elemental Capacitor"
  SparkOfFocus = 1727069360, // InventoryItem "Spark of Focus"
}

export const ARTIFICE_PERK_HASH = 3727270518; // InventoryItem "Artifice Armor"
