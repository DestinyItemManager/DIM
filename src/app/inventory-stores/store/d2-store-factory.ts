import { t } from 'app/i18next-t';
import { armorStats } from 'app/search/d2-known-values';
import { DestinyCharacterComponent, DestinyClass, DestinyGender } from 'bungie-api-ts/destiny2';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { bungieNetPath } from '../../dim-ui/BungieImage';
import { DimCharacterStat, DimStore } from '../store-types';

/**
 * A factory service for producing "stores" (characters or the vault).
 * The job of filling in their items is left to other code - this is just the basic store itself.
 */

const genderTypeToEnglish = {
  [DestinyGender.Male]: 'male',
  [DestinyGender.Female]: 'female',
  [DestinyGender.Unknown]: '',
} as const;

export function makeCharacter(
  defs: D2ManifestDefinitions,
  character: DestinyCharacterComponent,
  mostRecentLastPlayed: Date
): DimStore {
  const race = defs.Race[character.raceHash];
  const raceLocalizedName = race.displayProperties.name;
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNamesByGenderHash[gender.hash];
  const className = classy.genderedClassNamesByGenderHash[gender.hash];
  const genderLocalizedName = gender.displayProperties.name;
  const lastPlayed = new Date(character.dateLastPlayed);

  return {
    destinyVersion: 2,
    id: character.characterId,
    icon: bungieNetPath(character.emblemPath),
    name: t('ItemService.StoreName', {
      genderRace: raceLocalizedName,
      className,
    }),
    current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
    lastPlayed,
    background: bungieNetPath(character.emblemBackgroundPath),
    level: character.levelProgression.level, // Maybe?
    percentToNextLevel:
      character.levelProgression.progressToNextLevel / character.levelProgression.nextLevelAt,
    powerLevel: character.light,
    stats: getCharacterStatsData(defs, character.stats),
    classType: classy.classType,
    className,
    gender: genderLocalizedName,
    race: raceLocalizedName,
    genderRace,
    genderName: genderTypeToEnglish[gender.genderType] ?? '',
    isVault: false,
    color: character.emblemColor,
    items: [],
    hadErrors: false,
  };
}

export function makeVault(): DimStore {
  return {
    destinyVersion: 2,
    id: 'vault',
    name: t('Bucket.Vault'),
    classType: DestinyClass.Unknown,
    current: false,
    className: t('Bucket.Vault'),
    genderName: '',
    lastPlayed: new Date(-1),
    icon: vaultIcon,
    background: vaultBackground,
    items: [],
    isVault: true,
    color: { red: 49, green: 50, blue: 51, alpha: 1 },
    level: 0,
    percentToNextLevel: 0,
    powerLevel: 0,
    gender: '',
    race: '',
    genderRace: '',
    stats: [],
    hadErrors: false,
  };
}

/**
 * Compute character-level stats.
 */
export function getCharacterStatsData(
  defs: D2ManifestDefinitions,
  stats: {
    [key: number]: number;
  }
): { [hash: number]: DimCharacterStat } {
  const statAllowList = armorStats;
  const ret: { [hash: number]: DimCharacterStat } = {};

  // TODO: Fill in effect and countdown for D2 stats

  // Fill in missing stats
  statAllowList.forEach((statHash) => {
    const def = defs.Stat.get(statHash);
    const value = stats[statHash] || 0;
    const stat: DimCharacterStat = {
      hash: statHash,
      name: def.displayProperties.name,
      description: def.displayProperties.description,
      value,
      icon: bungieNetPath(def.displayProperties.icon),
    };
    ret[statHash] = stat;
  });

  return ret;
}
