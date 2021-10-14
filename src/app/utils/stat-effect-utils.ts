import { D2ArmorStatHashByName } from 'app/search/d2-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { statEffects } from 'data/d2/stat-effects';
import _ from 'lodash';

const D2ArmorStatNameByHash = _.invert(D2ArmorStatHashByName);

export function getClassAbilityCooldowns(characterClass: DestinyClass) {
  switch (characterClass) {
    case DestinyClass.Hunter:
      return statEffects.hunter.light.mobility;
    case DestinyClass.Warlock:
      return statEffects.warlock.light.recovery;
    case DestinyClass.Titan:
      return statEffects.titan.light.resilience;
    default:
      return null;
  }
}

export function isClassAbilityStat(statHash: number, characterClass: DestinyClass) {
  return (
    (statHash === D2ArmorStatHashByName.mobility && characterClass === DestinyClass.Hunter) ||
    (statHash === D2ArmorStatHashByName.recovery && characterClass === DestinyClass.Warlock) ||
    (statHash === D2ArmorStatHashByName.resilience && characterClass === DestinyClass.Titan)
  );
}

export function getStatEffects(
  statHash: number,
  characterClass: DestinyClass
): { light: string[] | undefined; dark: string[] | undefined } | undefined {
  const statName = D2ArmorStatNameByHash[statHash];
  if (statName) {
    switch (characterClass) {
      case DestinyClass.Hunter:
        return {
          light: statEffects.hunter.light[statName],
          dark: statEffects.hunter.dark[statName],
        };
      case DestinyClass.Warlock:
        return {
          light: statEffects.warlock.light[statName],
          dark: statEffects.warlock.dark[statName],
        };
      case DestinyClass.Titan:
        return { light: statEffects.titan.light[statName], dark: statEffects.titan.dark[statName] };
      default:
        return undefined;
    }
  }
}
