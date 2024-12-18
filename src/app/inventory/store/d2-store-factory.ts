import { startSpan } from '@sentry/browser';
import { t } from 'app/i18next-t';
import { armorStats } from 'app/search/d2-known-values';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import {
  DestinyCharacterComponent,
  DestinyClass,
  DestinyGender,
  DestinyItemComponent,
  DestinyProfileRecordsComponent,
  DestinyProfileResponse,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { bungieNetPath } from '../../dim-ui/BungieImage';
import { DimCharacterStat, DimStore, DimTitle } from '../store-types';
import { ItemCreationContext, processItems } from './d2-item-factory';

export function buildStores(itemCreationContext: ItemCreationContext): DimStore[] {
  // TODO: components may be hidden (privacy)

  const { profileResponse } = itemCreationContext;

  return startSpan({ name: 'processItems' }, () => {
    if (
      !profileResponse.profileInventory.data ||
      !profileResponse.characterInventories.data ||
      !profileResponse.characters.data
    ) {
      const additionalErrorMessage =
        $DIM_FLAVOR === 'dev'
          ? 'Vault or character inventory was missing - you likely forgot to select \
the required application scopes when registering the app on Bungie.net. \
Please carefully read the instructions in docs/CONTRIBUTING.md -> \
"Get your own API key" and select the required scopes'
          : undefined;
      errorLog(
        'd2-stores',
        'Vault or character inventory was missing - bailing in order to avoid corruption',
      );
      throw new DimError('BungieService.MissingInventory', additionalErrorMessage);
    }

    const lastPlayedDate = findLastPlayedDate(profileResponse);

    const vault = processVault(itemCreationContext);

    const characters = Object.keys(profileResponse.characters.data).map((characterId) =>
      processCharacter(itemCreationContext, characterId, lastPlayedDate),
    );
    const stores = [...characters, vault];

    return stores;
  });
}

/**
 * Process a single character from its raw form to a DIM store, with all the items.
 */
function processCharacter(
  itemCreationContext: ItemCreationContext,
  characterId: string,
  lastPlayedDate: Date,
): DimStore {
  const { defs, buckets, profileResponse } = itemCreationContext;
  const character = profileResponse.characters.data![characterId];
  const characterInventory = profileResponse.characterInventories.data?.[characterId]?.items || [];
  const profileInventory = profileResponse.profileInventory.data?.items || [];
  const characterEquipment = profileResponse.characterEquipment.data?.[characterId]?.items || [];
  const profileRecords = profileResponse.profileRecords?.data;

  const store = makeCharacter(defs, character, lastPlayedDate, profileRecords);

  // We work around the weird account-wide buckets by assigning them to the current character
  const items = characterInventory.concat(characterEquipment);

  if (store.current) {
    for (const i of profileInventory) {
      const bucket = buckets.byHash[i.bucketHash];
      // items that can be stored in a vault
      if (bucket && (bucket.vaultBucket || bucket.hash === BucketHashes.SpecialOrders)) {
        items.push(i);
      }
    }
  }

  store.items = processItems(itemCreationContext, store, items);
  return store;
}

function processVault(itemCreationContext: ItemCreationContext): DimStore {
  const { buckets, profileResponse } = itemCreationContext;
  const profileInventory = profileResponse.profileInventory.data
    ? profileResponse.profileInventory.data.items
    : [];

  const store = makeVault();

  const items: DestinyItemComponent[] = [];
  for (const i of profileInventory) {
    const bucket = buckets.byHash[i.bucketHash];
    // items that cannot be stored in the vault, and are therefore *in* a vault
    if (bucket && !bucket.vaultBucket && bucket.hash !== BucketHashes.SpecialOrders) {
      items.push(i);
    }
  }

  store.items = processItems(itemCreationContext, store, items);
  return store;
}

/**
 * Find the date of the most recently played character.
 */
function findLastPlayedDate(profileInfo: DestinyProfileResponse) {
  const dateLastPlayed = profileInfo.profile.data?.dateLastPlayed;
  if (dateLastPlayed) {
    return new Date(dateLastPlayed);
  }
  return new Date(0);
}

/**
 * A factory service for producing "stores" (characters or the vault).
 * The job of filling in their items is left to other code - this is just the basic store itself.
 */

const genderTypeToEnglish = {
  [DestinyGender.Male]: 'male',
  [DestinyGender.Female]: 'female',
  [DestinyGender.Unknown]: '',
} as const;

function makeCharacter(
  defs: D2ManifestDefinitions,
  character: DestinyCharacterComponent,
  mostRecentLastPlayed: Date,
  profileRecords: DestinyProfileRecordsComponent | undefined,
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

function makeVault(): DimStore {
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
  },
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
  genderHash: number,
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
    (profileRecords?.records[titleRecordHash]?.state ?? 0) & DestinyRecordState.RecordRedeemed,
  );

  // Gilding information is stored per-profile, not per-character
  if (titleInfo.gildingTrackingRecordHash) {
    const gildedRecord = profileRecords?.records[titleInfo.gildingTrackingRecordHash];

    if (gildedRecord?.completedCount) {
      gildedNum = gildedRecord.completedCount;
    }

    isGildedForCurrentSeason = Boolean(
      gildedRecord && !(gildedRecord.state & DestinyRecordState.ObjectiveNotCompleted),
    );
  }

  return { title, isCompleted, gildedNum, isGildedForCurrentSeason };
}
