export interface ClarityCharacterStats {
  Mobility: Mobility;
  Resilience: Resilience;
  Recovery: Recovery;
  Discipline: StatAbilities;
  Intellect: StatAbilities;
  Strength: StatAbilities;
}

export interface Ability {
  Hash: number;
  Cooldowns: number[];
}

export interface Override {
  Hash: number;
  Requirements: number[];
  CooldownOverride: number[];
  Scalar: number[];
  FlatIncrease: number[];
}

export interface StatAbilities {
  Abilities: Ability[];
  Overrides: Override[];
}

export interface Mobility extends StatAbilities {
  WalkingSpeed: number[];
  StrafeSpeed: number[];
  CrouchSpeed: number[];
}

export interface Recovery extends StatAbilities {
  TimeToFullHP: number[];
}

export interface Resilience extends StatAbilities {
  TotalHP: number[];
  DamageResistance: number[];
  FlinchResistance: number[];
}
