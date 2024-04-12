export interface ClarityCharacterStats {
  Mobility: Mobility;
  Resilience: Resilience;
  Recovery: Recovery;
  Discipline: StatAbilities;
  Intellect: Intellect;
  Strength: StatAbilities;
}

export interface ClarityStatsVersion {
  lastUpdate: number;
  schemaVersion: string;
}

export interface Ability {
  /** D2 Manifest inventoryItem hash. This is the hash of the subclass ability plug. */
  Hash: number;
  /** Array index represents the Character Stat tier. Cooldowns are in seconds. Rounded to 2 decimal points. Note: Rounding to 2 decimal places is solely for improving math precision when combined with Override objects. When displaying these cooldown times, it is STRONGLY recommended to round them to an integer. */
  Cooldowns: number[];
  /** Represents the behavior of certain abilities possessing additional scaling on their cooldown depending on the number of stored ability charges. The array's length represents the number of charges an ability has intrinsically. Numbers at every array index represent the Charge Rate scalar for the ability with [index] number of stored ability charges. As this is a Charge Rate scalar, cooldown times can be calculated by dividing the times in the Cooldowns member of abilities by the scalars in this array. Do note that this is not a required member of Ability objects and will only be present if an ability has multiple charges. (Therefore, if this property is absent, it is to be assumed that the ability only has a single charge by default) */
  ChargeBasedScaling?: number[];
  /** Abilities receive different amounts of 'chunk energy' from things like mods and other sources depending on their base cooldown. So let's say an armor mod gives you 10% grenade energy when popping your class ability — you'd multiply that 10% by the number listed here to arrive at the final amount you'll actually receive. An user-facing explanation of this property is available at the top level of the CharacterStat object under <ChunkEnergyScalarDescription>. */
  ChunkEnergyScalar?: number;
  /** This number represents the scalar for how much benefit you get from active super regeneration with your super ability. This ranges from 0.8 for a Tier 1 super to 1.2 for a Tier 5 super. Active Regen refers to any source of super energy that isn't just passively waiting for it to recharge. So aside from the normal passive regen and other effects that are 'additional base super regen', these influence everything. Be it collecting orbs of power, killing enemies (including assists), taking and dealing damage, armor mods, this covers everything else. */
  ActiveRegenScalar?: number;
}

/** Contains a locale ID that you can use to grab the description for the item in your selected language. The ID is provided in a [key].[value] format where there can be an arbitrary number of keys (though it'll be 2-3 at most). Then you can use these keys and values to query the './locale/[language code].json' files for the desired description. */
type Description = string;

export interface SuperAbility {
  /** D2 Manifest inventoryItem hash. This is the hash of the super ability subclass plug. */
  Hash: number;
  /** Array index represents the Character Stat tier. Cooldowns are in seconds. Rounded to 2 decimal points. Note: Rounding to 2 decimal places is solely for improving math precision when combined with Override objects. When displaying these cooldown times, it is STRONGLY recommended to round them to an integer. */
  Cooldowns: number[];
}

export interface Override {
  /** D2 Manifest inventoryItem hash. This is the "reason for the override" hash, such as an equipped exotic or aspect. */
  Hash: number;
  /** The inventoryItem hash of each ability that is required to trigger the effects of this 'Override'. Only overrides 'Abilities' under the same Character Stat as the 'Override'. Any one of these will trigger its effect defined in the other 'Override' properties. Wildcards: if the requirements array only contains 1 item and it's a 0, any ability tied to this Character Stat will have its cooldown overwritten. Negative numbers in the array indicate filters, these will be the inventoryItem hashes of subclasses multiplied by -1. Any abilities tied to the given subclass will have their cooldowns overwritten. */
  Requirements: number[];

  // One of CooldownOverride, Scalar, or ChunkEnergyOverride will be set.

  /** Array index represents the Character Stat tier. Cooldowns are in seconds. Rounded to 2 decimal points. Overrides the cooldowns of the items listed in the 'Requirements' array before the scalar is applied. Identical to the 'Cooldowns' array of the 'Ability' object. */
  CooldownOverride?: number[];
  /**
   * Length of the array is equal to the length of the 'Requirements' array. Each item represents a multiplier to the cooldown time of the abilities (of a subclass) listed in the 'Requirements' array at the same array index. Multiple scalars can stack with each other if their requirements are met (eg. Bastion Aspect and Citan's Ramparts Exotic Gauntlets). If 'CooldownOverride' property is specified: 'Scalar's are factored in after 'CooldownOverride's.
   */
  Scalar?: number[];
  /**
   * Length of the array is equal to the length of the <Requirements> array. Each item represents an override of the <ChunkEnergyScalar> property of the abilities (of a subclass) listed in the <Requirements> array at the same array index. If <CooldownOverride> or <Scalar> property is specified: Time is added to the cooldown times at every tier after <CooldownOverride>s and <Scalar>s have been applied.
   */
  ChunkEnergyOverride?: number[];
}

export interface StatAbilities {
  Abilities: Ability[];
  Overrides: Override[];
  Description: Description;
}

export interface DescriptionArray {
  Description: Description;
  Array: number[];
}

export interface Mobility extends StatAbilities {
  /** Represents how fast you can walk (not sprint) forward in meters per second. Array index represents the Mobility tier. Rounding beyond 2 decimal places is not recommended. */
  WalkSpeed: DescriptionArray;
  /** Represents how fast you can walk side-to-side and backwards in meters per second (85% of Walking Speed). Array index represents the Mobility tier. Rounding beyond 2 decimal places is not recommended. */
  StrafeSpeed: DescriptionArray;
  /** Represents how fast you can move while crouching in meters per second (55% of Walking Speed). Array index represents the Mobility tier. The speeds are represented in meters per second. Rounding beyond 2 decimal places is not recommended. */
  CrouchSpeed: DescriptionArray;
}

export interface Recovery extends StatAbilities {
  /** Array index represents the Recovery tier. The numbers represent how many seconds it takes to heal from 0 to full HP. Rounding is not recommended. */
  TotalRegenTime: DescriptionArray;
  /** Array index represents the Recovery tier. The numbers representhow many seconds after taking damage Health Regeneration starts. Rounding is not recommended. Good to know: Health is a fixed 70 HP portion of your total health alongside 'Shields' which a 115-130 HP portion of total health determined by Resilience. */
  HealthRegenDelay: DescriptionArray;
  /** Array index represents the Recovery tier. The numbers represent how fast your health regens after the delay. The numbers are provided in % of total health per second (total health is a fixed 70HP). Rounding beyond 1-2 decimal places is not recommended. For all intents and purposes, you can divide the numbers by 100, multiply by 70, and display it as HP/second. */
  HealthRegenSpeed: DescriptionArray;
  /** Array index represents the Recovery tier. The numbers represent how many seconds after taking damage Shield Regeneration starts. Rounding is not recommended. Good to know: Shield health is a 115-130 HP portion of total health determined by Resilience. */
  ShieldRegenDelay: DescriptionArray;
  /** Array index represents the Recovery tier. The numbers represent how fast your shields regen after the delay. The numbers are provided in % of total shield health per second (shield health is a 115-130 HP portion of total health determined by Resilience). Rounding beyond 1-2 decimal places is not recommended. For all intents and purposes, you can take the TotalHP value at a specified Resilience tier and subtract 70 to get the shield health. After that, you can divide the ShieldRegenSpeed numbers by 100, multiply it by the selected shield health, and display it as HP/second. (Though it's probably better to leave it in % to avoid potentially causing confusion for users) */
  ShieldRegenSpeed: DescriptionArray;
}

export interface Resilience extends StatAbilities {
  /** Array index represents the Resilience tier. The numbers represent how much HP your <Shields> have at each tier. <Shields> are the 115 to 130 HP 'right-side portion' of your Total HP alongside <Health>. The amount of <Health> you have depends on the activity: 100 HP in most Crucible playlists (excluding Momentum Control and Mayhem) and 70 HP everywhere else. */
  ShieldHP: DescriptionArray;
  /** Array index represents the Resilience tier. The numbers represent the percentage damage resistance granted IN PVE at each tier. */
  PvEDamageResistance: DescriptionArray;
  /** Array index represents the Resilience tier. The numbers represent the percentage flinch resistance granted at each tier. */
  FlinchResistance: DescriptionArray;
}

export interface Intellect {
  SuperAbilities: SuperAbility[];
  Overrides: Override[];
  Description: Description;
}
