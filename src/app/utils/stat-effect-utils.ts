import { D2ArmorStatHashByName } from 'app/search/d2-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { statEffects } from 'data/d2/stat-effects';

export function getClassAbilityCooldowns(characterClass?: DestinyClass) {
  switch (characterClass) {
    case DestinyClass.Hunter:
      return statEffects.mobility.classAbility;
    case DestinyClass.Warlock:
      return statEffects.recovery.classAbility;
    case DestinyClass.Titan:
      return statEffects.resilience.classAbility;
    default:
      return null;
  }
}

export function isClassAbilityStat(statHash: number, characterClass?: DestinyClass) {
  return (
    (statHash === D2ArmorStatHashByName.mobility && characterClass === DestinyClass.Hunter) ||
    (statHash === D2ArmorStatHashByName.recovery && characterClass === DestinyClass.Warlock) ||
    (statHash === D2ArmorStatHashByName.resilience && characterClass === DestinyClass.Titan)
  );
}

export function getStatEffects(statHash: number) {
  switch (statHash) {
    case D2ArmorStatHashByName.mobility:
      return statEffects.mobility;
    case D2ArmorStatHashByName.recovery:
      return statEffects.recovery;
    case D2ArmorStatHashByName.resilience:
      return statEffects.resilience;
    case D2ArmorStatHashByName.intellect:
      return statEffects.intellect;
    case D2ArmorStatHashByName.discipline:
      return statEffects.discipline;
    case D2ArmorStatHashByName.strength:
      return statEffects.strength;
    default:
      return null;
  }
}
