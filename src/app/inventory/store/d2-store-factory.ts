import { t } from 'app/i18next-t';
import { armorStats } from 'app/search/d2-known-values';
import {
  DestinyCharacterComponent,
  DestinyClass,
  DestinyGender,
  DestinyProfileRecordsComponent,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { bungieNetPath } from '../../dim-ui/BungieImage';
import { DimCharacterStat, DimStore, DimTitle } from '../store-types';

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
  mostRecentLastPlayed: Date,
  profileRecords: DestinyProfileRecordsComponent | undefined
): DimStore {
  const race = defs.Race.get(character.raceHash);
  const raceLocalizedName = race.displayProperties.name;
  const gender = defs.Gender.get(character.genderHash);
  const classy = defs.Class.get(character.classHash);
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
    genderHash: character.genderHash,
    isVault: false,
    color: character.emblemColor,
    titleInfo: character.titleRecordHash
      ? getTitleInfo(character.titleRecordHash, defs, profileRecords, character.genderHash)
      : undefined,
    items: [],
    hadErrors: false,
  };
}

export function makeVault(): DimStore {
  const vaultName = t('Bucket.Vault');
  return {
    destinyVersion: 2,
    id: 'vault',
    name: vaultName,
    classType: DestinyClass.Unknown,
    current: false,
    className: vaultName,
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
  for (const statHash of statAllowList) {
    const def = defs.Stat.get(statHash);
    const value = stats[statHash] || 0;
    const stat: DimCharacterStat = {
      hash: statHash,
      name: def.displayProperties.name,
      description: def.displayProperties.description,
      value,
      icon: def.displayProperties.icon,
    };
    ret[statHash] = stat;
  }

  return ret;
}

export function getTitleInfo(
  titleRecordHash: number,
  defs: D2ManifestDefinitions,
  profileRecords: DestinyProfileRecordsComponent | undefined,
  genderHash: number
): DimTitle | undefined {
  // Titles can be classified, in which case `titleInfo` is missing
  const titleInfo = defs?.Record.get(titleRecordHash)?.titleInfo;
  if (!titleInfo) {
    return undefined;
  }
  const title = titleInfo.titlesByGenderHash?.[genderHash];
  if (!title) {
    return undefined;
  }

  let gildedNum = 0;
  let isGildedForCurrentSeason = false;

  const isCompleted = Boolean(
    (profileRecords?.records[titleRecordHash].state ?? 0) & DestinyRecordState.RecordRedeemed
  );

  // Gilding information is stored per-profile, not per-character
  if (titleInfo.gildingTrackingRecordHash) {
    const gildedRecord = profileRecords?.records[titleInfo.gildingTrackingRecordHash];

    if (gildedRecord?.completedCount) {
      gildedNum = gildedRecord.completedCount;
    }

    isGildedForCurrentSeason = Boolean(
      gildedRecord && !(gildedRecord.state & DestinyRecordState.ObjectiveNotCompleted)
    );
  }

  return { title, isCompleted, gildedNum, isGildedForCurrentSeason };
}
