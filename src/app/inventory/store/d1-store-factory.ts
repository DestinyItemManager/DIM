import { t } from 'app/i18next-t';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../../destiny1/d1-definitions';
import { D1Progression, D1Store, DimStore } from '../store-types';
import { getCharacterStatsData } from './character-utils';

// Label isn't used, but it helps us understand what each one is
const progressionMeta = {
  529303302: { label: 'Cryptarch', order: 0 },
  3233510749: { label: 'Vanguard', order: 1 },
  1357277120: { label: 'Crucible', order: 2 },
  2778795080: { label: 'Dead Orbit', order: 3 },
  1424722124: { label: 'Future War Cult', order: 4 },
  3871980777: { label: 'New Monarchy', order: 5 },
  2161005788: { label: 'Iron Banner', order: 6 },
  174528503: { label: "Crota's Bane", order: 7 },
  807090922: { label: "Queen's Wrath", order: 8 },
  3641985238: { label: 'House of Judgment', order: 9 },
  2335631936: { label: 'Gunsmith', order: 10 },
  2576753410: { label: 'SRL', order: 11 },
};

export function makeCharacter(
  raw: {
    character: { base: any; progression: { progressions: never[] }; advisors: any };
    id: any;
    data: { buckets: any };
  },
  defs: D1ManifestDefinitions,
  mostRecentLastPlayed: Date
): {
  store: D1Store;
  items: any[];
} {
  const character = raw.character.base;
  const race = defs.Race[character.characterBase.raceHash];
  let genderRace = '';
  let className = '';
  let raceName = '';
  let gender: DimStore['gender'] = '';
  let genderName: DimStore['genderName'] = '';
  if (character.characterBase.genderType === 0) {
    gender = 'male';
    genderName = 'male';
    genderRace = race.raceNameMale;
    raceName = race.raceNameMale;
    className = defs.Class[character.characterBase.classHash].classNameMale;
  } else {
    gender = 'female';
    genderName = 'female';
    genderRace = race.raceNameFemale;
    raceName = race.raceNameFemale;
    className = defs.Class[character.characterBase.classHash].classNameFemale;
  }

  const lastPlayed = new Date(character.characterBase.dateLastPlayed);

  const progressions: D1Progression[] = raw.character.progression?.progressions ?? [];
  for (const prog of progressions) {
    Object.assign(
      prog,
      defs.Progression.get(prog.progressionHash),
      progressionMeta[prog.progressionHash]
    );
    const faction = _.find(defs.Faction, (f) => f.progressionHash === prog.progressionHash);
    if (faction) {
      prog.faction = faction;
    }
  }

  const store: D1Store = {
    destinyVersion: 1,
    id: raw.id,
    name: t('ItemService.StoreName', {
      genderRace,
      className,
    }),
    icon: `https://www.bungie.net/${character.emblemPath}`,
    current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
    lastPlayed,
    background: `https://www.bungie.net/${character.backgroundPath}`,
    level: character.characterLevel,
    powerLevel: character.characterBase.powerLevel,
    stats: getCharacterStatsData(defs, character.characterBase),
    classType: character.characterBase.classType,
    className,
    gender,
    race: raceName,
    genderRace,
    genderName,
    percentToNextLevel: character.percentToNextLevel / 100,
    progressions,
    advisors: raw.character.advisors,
    isVault: false,
    items: [],
    hadErrors: false,
  };

  let items: any[] = [];

  const bucketize = (pail: any) => {
    _.forIn(pail.items, (item: any) => {
      item.bucket = pail.bucketHash;
    });

    items = items.concat(pail.items);
  };

  _.forIn(raw.data.buckets, (bucket: any) => {
    _.forIn(bucket, bucketize);
  });

  if (_.has(character.inventory.buckets, 'Invisible')) {
    _.forIn(character.inventory.buckets.Invisible, bucketize);
  }

  return {
    store,
    items,
  };
}

export function makeVault(raw: { data: { buckets: any } }): {
  store: D1Store;
  items: any[];
} {
  const store: D1Store = {
    destinyVersion: 1,
    id: 'vault',
    name: t('Bucket.Vault'),
    classType: DestinyClass.Unknown,
    current: false,
    genderName: '',
    className: t('Bucket.Vault'),
    lastPlayed: new Date('2005-01-01T12:00:01Z'),
    icon: vaultIcon,
    background: vaultBackground,
    items: [],
    isVault: true,
    progressions: [],
    advisors: {},
    level: 0,
    percentToNextLevel: 0,
    powerLevel: 0,
    gender: '',
    race: '',
    genderRace: '',
    stats: [],
    hadErrors: false,
  };

  let items: any[] = [];

  _.forIn(raw.data.buckets, (bucket: any) => {
    _.forIn(bucket.items, (item: any) => {
      item.bucket = bucket.bucketHash;
    });

    items = items.concat(bucket.items);
  });

  return {
    store,
    items,
  };
}
