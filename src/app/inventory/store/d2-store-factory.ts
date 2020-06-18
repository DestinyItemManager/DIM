import {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyClass,
  DestinyGender,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { bungieNetPath } from '../../dim-ui/BungieImage';
import { count } from '../../utils/util';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import vaultBackground from 'images/vault-background.svg';
import vaultIcon from 'images/vault.svg';
import { t } from 'app/i18next-t';
import { D2Store, D2Vault, DimCharacterStat } from '../store-types';
import { D2Item } from '../item-types';
import { D2StoresService } from '../d2-stores';
import { armorStats } from './stats';
import { getCurrentStore } from '../stores-helpers';

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
  /**
   * Get the total amount of this item in the store, across all stacks,
   * excluding stuff in the postmaster.
   */
  amountOfItem(this: D2Store, item: { hash: number }) {
    return _.sumBy(this.items, (i) =>
      i.hash === item.hash && (!i.location || !i.location.inPostmaster) ? i.amount : 0
    );
  },

  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(this: D2Store, item: D2Item) {
    if (!item.bucket) {
      console.error("item needs a 'bucket' field", item);
      return 10;
    }
    return item.bucket.capacity;
  },

  /**
   * How many *more* items like this item can fit in this store?
   * This takes into account stackables, so the answer will be in
   * terms of individual pieces.
   */
  spaceLeftForItem(this: D2Store, item: D2Item) {
    if (!item.type) {
      throw new Error("item needs a 'type' field");
    }
    // Account-wide buckets (mods, etc) are only on the first character
    if (item.bucket.accountWide && !this.current) {
      return 0;
    }
    if (!item.bucket) {
      return 0;
    }

    const occupiedStacks = this.buckets[item.bucket.hash]
      ? this.buckets[item.bucket.hash].length
      : 10;
    const openStacks = Math.max(0, this.capacityForItem(item) - occupiedStacks);

    // Some things can't have multiple stacks.
    if (item.uniqueStack) {
      // If the item lives in an account-wide bucket (like modulus reports)
      // we need to check out how much space is left in that bucket, which is
      // only on the current store.
      if (item.bucket.accountWide) {
        const existingAmount = getCurrentStore(this.getStoresService().getStores())!.amountOfItem(
          item
        );

        if (existingAmount === 0) {
          // if this would be the first stack, make sure there's room for a stack
          return openStacks > 0 ? item.maxStackSize : 0;
        } else {
          // return how much can be added to the existing stack
          return Math.max(item.maxStackSize - existingAmount, 0);
        }
      }

      // If there's some already there, we can add enough to fill a stack. Otherwise
      // we can only add if there's an open stack.
      const existingAmount = this.amountOfItem(item);
      return existingAmount > 0
        ? Math.max(item.maxStackSize - this.amountOfItem(item), 0)
        : openStacks > 0
        ? item.maxStackSize
        : 0;
    }

    const maxStackSize = item.maxStackSize || 1;
    if (maxStackSize === 1) {
      return openStacks;
    } else {
      let existingAmount = this.amountOfItem(item);
      while (existingAmount > 0) {
        existingAmount -= maxStackSize;
      }
      return Math.max(openStacks * maxStackSize - existingAmount, 0);
    }
  },

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
    // Vault has different capacity rules
    capacityForItem(this: D2Vault, item: D2Item) {
      if (!item.bucket) {
        throw new Error("item needs a 'bucket' field");
      }
      const vaultBucket = item.bucket.vaultBucket;
      return vaultBucket ? vaultBucket.capacity : 0;
    },
    spaceLeftForItem(this: D2Vault, item: D2Item) {
      if (!item.bucket.vaultBucket) {
        return 0;
      }
      const vaultBucket = item.bucket.vaultBucket;
      const usedSpace = item.bucket.vaultBucket
        ? count(this.items, (i) => Boolean(i.bucket.vaultBucket?.hash === vaultBucket.hash))
        : 0;
      const openStacks = Math.max(0, this.capacityForItem(item) - usedSpace);
      const maxStackSize = item.maxStackSize || 1;
      if (maxStackSize === 1) {
        return openStacks;
      } else {
        const existingAmount = this.amountOfItem(item);
        const stackSpace = Math.ceil(existingAmount / maxStackSize) * maxStackSize - existingAmount;
        return openStacks * maxStackSize + stackSpace;
      }
    },
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
