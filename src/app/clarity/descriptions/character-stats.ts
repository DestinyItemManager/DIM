export interface ClarityCharacterStats {
  Mobility: Mobility;
  Resilience: Resilience;
  Recovery: Recovery;
  Discipline: StatAbilities;
  Intellect: StatAbilities;
  Strength: StatAbilities;
}

export interface ClarityStatsVersion {
  lastUpdate: number;
  lastBreakingChange: number;
}

export interface Ability {
  Hash: number;
  /** Array index represents the Character Stat tier. Cooldowns are in seconds. Rounded to 2 decimal points. Note: Rounding to 2 decimal places is solely for improving math precision when combined with Override objects. When displaying these cooldown times, it is STRONGLY recommended to round them to an integer. */
  Cooldowns: number[];
}

export interface Override {
  Hash: number;
  /** The inventoryItem hash of each ability that is required to trigger the effects of this Scalar. Any one of these will trigger its effect as only one is required to do so. (These are usually also the same ability but for the different subclasses, hence you should NOT be able to have more than one equipped at once) */
  Requirements: number[];

  // One of CooldownOverride, Scalar, or FlatIncrease will be set.

  /** Array index represents the Character Stat tier. Cooldowns are in seconds. Rounded to 2 decimal points. Overrides the cooldowns of the items listed in the 'Requirements' array before the scalar is applied. Identical to the 'Cooldowns' array of the 'Ability' object. Contains 11 0s if not in use. */
  CooldownOverride?: number[];
  /**
   * Length of the array is equal to the length of the 'Requirements' array. Each item represents a multiplier to the cooldown time of the abilities listed in the 'Requirements' array at the same array index. Multiple scalars can stack with each other if their requirements are met (eg. Bastion Aspect and Citan's Ramparts Exotic Gauntlets). If 'CooldownOverride' property is specified: 'Scalar's are factored in after 'CooldownOverride's
   */
  Scalar?: number[];
  /**
   * Length of the array is equal to the length of the 'Requirements' array. Each item represents a flat increase to the cooldown time of the abilities listed in the 'Requirements' array at the same array index. If 'CooldownOverride' or 'Scalar' property is specified: Time is added to the cooldown times at every tier after 'CooldownOverride's and 'Scalar's have been applied.
   */
  FlatIncrease?: number[];
}

export interface StatAbilities {
  Abilities: Ability[];
  Overrides: Override[];
}

export interface Mobility extends StatAbilities {
  /** Array index represents the Mobility tier. The speeds are represented in meters per second. Rounding beyond 2 decimal places is not recommended. */
  WalkingSpeed: number[];
  /** Array index represents the Mobility tier. The speeds are represented in meters per second. Rounding beyond 2 decimal places is not recommended. */
  StrafeSpeed: number[];
  /** Array index represents the Mobility tier. The speeds are represented in meters per second. Rounding beyond 2 decimal places is not recommended. */
  CrouchSpeed: number[];
}

export interface Recovery extends StatAbilities {
  /** Array index represents the Recovery tier. The numbers represent how many seconds it takes to heal to full HP. */
  TimeToFullHP: number[];
}

export interface Resilience extends StatAbilities {
  /** Array index represents the Resilience tier. The numbers represent your total HP at each tier. 'Health' is a static 70 HP, the rest are what Bungie calls 'Shields' in-game. If you wish to display them separately, just subtract 70 from the numbers to get your shield HP. */
  TotalHP: number[];
  /** Array index represents the Resilience tier. The numbers represent the percentage damage resistance granted *IN PVE* at each tier. */
  DamageResistance: number[];
  /** Array index represents the Resilience tier. The numbers represent the percentage flinch resistance granted at each tier. */
  FlinchResistance: number[];
}
