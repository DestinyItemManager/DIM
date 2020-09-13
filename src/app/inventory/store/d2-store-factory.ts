import { t } from 'app/i18next-t';
import { armorStats } from 'app/search/d2-known-values';
import {
  DestinyCharacterComponent,
  DestinyClass,
  DestinyGender,
  DestinyItemComponent,
} from 'bungie-api-ts/destiny2';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { bungieNetPath } from '../../dim-ui/BungieImage';
import { D2StoresService } from '../d2-stores';
import { D2Item } from '../item-types';
import { D2Store, D2Vault, DimCharacterStat } from '../store-types';

/**
 * A factory service for producing "stores" (characters or the vault).
 * The job of filling in their items is left to other code - this is just the basic store itself.
 */

const genderTypeToEnglish = {
  [DestinyGender.Male]: 'male',
  [DestinyGender.Female]: 'female',
  [DestinyGender.Unknown]: '',
};

// Prototype for Store objects - add methods to this to add them to all
// stores.
export const StoreProto = {
  // Remove an item from this store. Returns whether it actually removed anything.
  removeItem(this: D2Store, item: D2Item) {
    // Completely remove the source item
    const match = (i: D2Item) => item.index === i.index;
    const sourceIndex = this.items.findIndex(match);
    if (sourceIndex >= 0) {
      this.items = [...this.items.slice(0, sourceIndex), ...this.items.slice(sourceIndex + 1)];

      let bucketItems = this.buckets[item.location.hash];
      const bucketIndex = bucketItems.findIndex(match);
      bucketItems = [...bucketItems.slice(0, bucketIndex), ...bucketItems.slice(bucketIndex + 1)];
      this.buckets[item.location.hash] = bucketItems;

      if (
        this.current &&
        item.location.accountWide &&
        this.vault &&
        this.vault.vaultCounts[item.location.hash]
      ) {
        this.vault.vaultCounts[item.location.hash].count--;
      }

      return true;
    }
    return false;
  },

  addItem(this: D2Store, item: D2Item) {
    this.items = [...this.items, item];
    this.buckets[item.location.hash] = [...this.buckets[item.location.hash], item];
    item.owner = this.id;

    if (this.current && item.location.accountWide && this.vault) {
      this.vault.vaultCounts[item.location.hash].count++;
    }
  },

  isDestiny1(this: D2Store) {
    return false;
  },

  isDestiny2(this: D2Store) {
    return true;
  },

  getStoresService() {
    return D2StoresService;
  },
};

export function makeCharacter(
  defs: D2ManifestDefinitions,
  character: DestinyCharacterComponent,
  mostRecentLastPlayed: Date
): D2Store {
  const race = defs.Race[character.raceHash];
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNamesByGenderHash[gender.hash];
  const className = classy.genderedClassNamesByGenderHash[gender.hash];
  const genderLocalizedName = gender.displayProperties.name;
  const lastPlayed = new Date(character.dateLastPlayed);

  const store: D2Store = Object.assign(Object.create(StoreProto), {
    destinyVersion: 2,
    id: character.characterId,
    icon: bungieNetPath(character.emblemPath),
    name: t('ItemService.StoreName', {
      genderRace,
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
    genderRace,
    genderName: genderTypeToEnglish[gender.genderType] ?? '',
    isVault: false,
    color: character.emblemColor,
  });

  return store;
}

export function makeVault(
  defs: D2ManifestDefinitions,
  profileCurrencies: DestinyItemComponent[]
): D2Vault {
  const currencies = profileCurrencies.map((c) => ({
    itemHash: c.itemHash,
    quantity: c.quantity,
    displayProperties: defs.InventoryItem.get(c.itemHash).displayProperties,
  }));

  return Object.assign(Object.create(StoreProto), {
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
    currencies,
    isVault: true,
    color: { red: 49, green: 50, blue: 51 },
    removeItem(this: D2Vault, item: D2Item): boolean {
      const result = StoreProto.removeItem.call(this, item);
      if (item.location.vaultBucket) {
        this.vaultCounts[item.location.vaultBucket.hash].count--;
      }
      return result;
    },
    addItem(this: D2Vault, item: D2Item) {
      StoreProto.addItem.call(this, item);
      if (item.location.vaultBucket) {
        this.vaultCounts[item.location.vaultBucket.hash].count++;
      }
    },
  });
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
