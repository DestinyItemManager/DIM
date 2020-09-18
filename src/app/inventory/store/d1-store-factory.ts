import { t } from 'app/i18next-t';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../../destiny1/d1-definitions';
import { D1Store, D1Vault, DimStore, DimVault } from '../store-types';
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
  raw,
  defs: D1ManifestDefinitions,
  mostRecentLastPlayed: Date,
  currencies: DimVault['currencies']
): {
  store: D1Store;
  items: any[];
} {
  const character = raw.character.base;
  if (!currencies.length) {
    try {
      currencies.push(
        ...character.inventory.currencies.map((c) => {
          const itemDef = defs.InventoryItem.get(c.itemHash);
          return {
            itemHash: c.itemHash,
            quantity: c.value,
            displayProperties: {
              name: itemDef.itemName,
              description: itemDef.itemDescription,
              icon: itemDef.icon,
              hasIcon: Boolean(itemDef.icon),
            },
          };
        })
      );
    } catch (e) {
      console.log('error', e);
    }
  }

  const race = defs.Race[character.characterBase.raceHash];
  let genderRace = '';
  let className = '';
  let gender: DimStore['gender'] = '';
  let genderName: DimStore['genderName'] = '';
  if (character.characterBase.genderType === 0) {
    gender = 'male';
    genderName = 'male';
    genderRace = race.raceNameMale;
    className = defs.Class[character.characterBase.classHash].classNameMale;
  } else {
    gender = 'female';
    genderName = 'female';
    genderRace = race.raceNameFemale;
    className = defs.Class[character.characterBase.classHash].classNameFemale;
  }

  const lastPlayed = new Date(character.characterBase.dateLastPlayed);

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
    genderRace,
    genderName,
    percentToNextLevel: character.percentToNextLevel / 100,
    progression: raw.character.progression,
    advisors: raw.character.advisors,
    isVault: false,
    items: [],
  };

  if (store.progression) {
    store.progression.progressions.forEach((prog) => {
      Object.assign(
        prog,
        defs.Progression.get(prog.progressionHash),
        progressionMeta[prog.progressionHash]
      );
      const faction = _.find(defs.Faction, (f) => f.progressionHash === prog.progressionHash);
      if (faction) {
        prog.faction = faction;
      }
    });
  }

  let items: any[] = [];
  _.forIn(raw.data.buckets, (bucket: any) => {
    _.forIn(bucket, (pail: any) => {
      _.forIn(pail.items, (item: any) => {
        item.bucket = pail.bucketHash;
      });

      items = items.concat(pail.items);
    });
  });

  if (_.has(character.inventory.buckets, 'Invisible')) {
    _.forIn(character.inventory.buckets.Invisible, (pail: any) => {
      _.forIn(pail.items, (item: any) => {
        item.bucket = pail.bucketHash;
      });

      items = items.concat(pail.items);
    });
  }

  return {
    store,
    items,
  };
}

export function makeVault(
  raw,
  currencies: DimVault['currencies']
): {
  store: D1Vault;
  items: any[];
} {
  const store: D1Vault = {
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
    currencies,
    isVault: true,
    progression: {
      progressions: [],
    },
    advisors: {},
    level: 0,
    percentToNextLevel: 0,
    powerLevel: 0,
    gender: '',
    genderRace: '',
    stats: [],
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
