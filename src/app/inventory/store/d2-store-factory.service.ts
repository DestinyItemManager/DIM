import { copy as angularCopy, IPromise } from 'angular';
import {
  DestinyCharacterComponent,
  DestinyClass,
  DestinyItemComponent,
  DestinyProgression,
  DestinyStatDefinition
  } from 'bungie-api-ts/destiny2';
import * as _ from 'underscore';
import uuidv4 from 'uuid/v4';
import { bungieNetPath } from '../../dim-ui/bungie-image';
import { count, sum } from '../../util';
import { DimInventoryBucket, DimInventoryBuckets } from '../../destiny2/d2-buckets.service';
import { D2ManifestDefinitions, LazyDefinition } from '../../destiny2/d2-definitions.service';
import { Loadout } from '../../loadout/loadout.service';
import { getClass } from './character-utils';
import { DimItem } from './d2-item-factory.service';
import { DimStore } from './d2-store-factory.service';
// tslint:disable-next-line:no-implicit-dependencies
import vaultBackground from 'app/images/vault-background.png';
// tslint:disable-next-line:no-implicit-dependencies
import vaultIcon from 'app/images/vault.png';
import { showInfoPopup } from '../../shell/info-popup';
import { t } from 'i18next';

export interface DimCharacterStat {
  id: number;
  name: string;
  description: string;
  value: number;
  icon: string;
  tiers: number[];
  tierMax: number;
  tier: number;
}

export interface DimStore {
  id: string;
  name: string;
  items: DimItem[];
  isVault: boolean;
  vault?: DimStore;
  buckets: { [bucketId: number]: DimItem[] };

  destinyVersion: 1 | 2;
  icon: string;
  current: boolean;
  lastPlayed: Date;
  background: string;
  level: number;
  percentToNextLevel: number;
  powerLevel: number;
  stats: DimCharacterStat[];
  class: string;
  classType: DestinyClass;
  className: string;
  gender: string;
  genderRace: string;
  progression: null | {
    progressions: { [key: number]: DestinyProgression };
  };

  updateCharacterInfo(defs: D2ManifestDefinitions, bStore: DestinyCharacterComponent): IPromise<DimStore[]>;
  amountOfItem(item: DimItem): number;
  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(item: DimItem): number;
  /**
   * How many *more* items like this item can fit in this store?
   * This takes into account stackables, so the answer will be in
   * terms of individual pieces.
   */
  spaceLeftForItem(item: DimItem): number;

  /** Remove an item from this store. Returns whether it actually removed anything. */
  removeItem(item: DimItem): boolean;

  addItem(item: DimItem): void;

  // Create a loadout from this store's equipped items
  // TODO: Loadout type
  loadoutFromCurrentlyEquipped(name: string): Loadout;

  // TODO: implement this for D2
  factionAlignment();
}

export interface DimVault extends DimStore {
  d2VaultCounts: { [bucketId: number]: { count: number; bucket: DimInventoryBucket } };
  vaultCounts: { [category: string]: number };

  legendaryMarks: number;
  glimmer: number;
  silver: number;
}

/**
 * A factory service for producing "stores" (characters or the vault).
 * The job of filling in their items is left to other code - this is just the basic store itself.
 */
// Prototype for Store objects - add methods to this to add them to all
// stores.
const StoreProto = {
  /**
   * Get the total amount of this item in the store, across all stacks,
   * excluding stuff in the postmaster.
   */
  amountOfItem(item: DimItem) {
    return sum((this.items as DimItem[]).filter((i) => {
      return i.hash === item.hash && !i.location.inPostmaster;
    }), (i) => i.amount);
  },

  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(item: DimItem) {
    if (item && !item.bucket) {
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
  spaceLeftForItem(item: DimItem) {
    if (!item.type) {
      throw new Error("item needs a 'type' field");
    }
    // Account-wide buckets (mods, etc) are only on the first character
    if (item.location.accountWide && !this.current) {
      return 0;
    }
    const openStacks = Math.max(0, this.capacityForItem(item) -
                                this.buckets[item.bucket.id].length);
    const maxStackSize = item.maxStackSize || 1;
    if (maxStackSize === 1) {
      return openStacks;
    } else {
      const existingAmount = this.amountOfItem(item);
      const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
      return (openStacks * maxStackSize) + stackSpace;
    }
  },

  updateCharacterInfo(defs: D2ManifestDefinitions, character: DestinyCharacterComponent) {
    this.level = character.levelProgression.level; // Maybe?
    this.powerLevel = character.light;
    this.background = bungieNetPath(character.emblemBackgroundPath);
    this.icon = bungieNetPath(character.emblemPath);
    this.stats = { ...this.stats, ...getCharacterStatsData(defs.Stat, character.stats) };
  },

  // Remove an item from this store. Returns whether it actually removed anything.
  removeItem(item) {
    // Completely remove the source item
    const match = (i) => item.index === i.index;
    const sourceIndex = this.items.findIndex(match);
    if (sourceIndex >= 0) {
      this.items.splice(sourceIndex, 1);

      const bucketItems = this.buckets[item.location.id];
      const bucketIndex = bucketItems.findIndex(match);
      bucketItems.splice(bucketIndex, 1);

      if (this.current && item.location.accountWide) {
        this.vault.d2VaultCounts[item.location.id].count--;
      }

      return true;
    }
    return false;
  },

  addItem(item: DimItem) {
    this.items.push(item);
    const bucketItems = this.buckets[item.location.id];
    bucketItems.push(item);
    if (item.location.type === 'LostItems' && bucketItems.length >= item.location.capacity) {
      showInfoPopup('lostitems', {
        type: 'warning',
        title: t('Postmaster.Limit'),
        body: t('Postmaster.Desc', { store: this.name }),
        hide: t('Help.NeverShow')
      });
    }
    item.owner = this.id;

    if (this.current && item.location.accountWide) {
      this.vault.d2VaultCounts[item.location.id].count++;
    }
  },

  // Create a loadout from this store's equipped items
  loadoutFromCurrentlyEquipped(name: string): Loadout {
    const allItems = (this.items as DimItem[])
      .filter((item) => item.canBeInLoadout())
      // tslint:disable-next-line:no-unnecessary-callback-wrapper
      .map((item) => angularCopy(item));
    return {
      id: uuidv4(),
      classType: -1,
      name,
      items: _.groupBy(allItems, (i) => i.type.toLowerCase())
    };
  },

  factionAlignment() {
    return null;
  }
};

export function makeCharacter(defs: D2ManifestDefinitions, character: DestinyCharacterComponent, mostRecentLastPlayed: Date): DimStore {
  const race = defs.Race[character.raceHash];
  const gender = defs.Gender[character.genderHash];
  const classy = defs.Class[character.classHash];
  const genderRace = race.genderedRaceNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const className = classy.genderedClassNames[gender.genderType === 1 ? 'Female' : 'Male'];
  const genderName = gender.displayProperties.name;
  const lastPlayed = new Date(character.dateLastPlayed);

  const store: DimStore = Object.assign(Object.create(StoreProto), {
    destinyVersion: 2,
    id: character.characterId,
    icon: bungieNetPath(character.emblemPath),
    current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
    lastPlayed,
    background: bungieNetPath(character.emblemBackgroundPath),
    level: character.levelProgression.level, // Maybe?
    percentToNextLevel: character.levelProgression.progressToNextLevel / character.levelProgression.nextLevelAt,
    powerLevel: character.light,
    stats: getCharacterStatsData(defs.Stat, character.stats),
    class: getClass(classy.classType),
    classType: classy.classType,
    className,
    gender: genderName,
    genderRace,
    isVault: false
  });

  store.name = `${store.genderRace} ${store.className}`;

  return store;
}

export function makeVault(buckets: DimInventoryBuckets, profileCurrencies: DestinyItemComponent[]): DimVault {
  const glimmer = _.find(profileCurrencies, (cur) => cur.itemHash === 3159615086);
  const legendary = _.find(profileCurrencies, (cur) => cur.itemHash === 1022552290);
  const silver = _.find(profileCurrencies, (cur) => cur.itemHash === 3147280338);
  const currencies = {
    glimmer: glimmer ? glimmer.quantity : 0,
    marks: legendary ? legendary.quantity : 0,
    silver: silver ? silver.quantity : 0
  };

  return Object.assign(Object.create(StoreProto), {
    destinyVersion: 2,
    id: 'vault',
    name: t('Bucket.Vault'),
    class: 'vault',
    current: false,
    className: t('Bucket.Vault'),
    lastPlayed: new Date('2005-01-01T12:00:01Z'),
    icon: vaultIcon,
    background: vaultBackground,
    items: [],
    legendaryMarks: currencies.marks,
    glimmer: currencies.glimmer,
    silver: currencies.silver,
    isVault: true,
    // Vault has different capacity rules
    capacityForItem(item: DimItem) {
      if (!item.bucket) {
        throw new Error("item needs a 'bucket' field");
      }
      const vaultBucket = buckets.byHash[item.bucket.hash].vaultBucket;
      return vaultBucket ? vaultBucket.capacity : 0;
    },
    spaceLeftForItem(item: DimItem) {
      if (!item.bucket.vaultBucket) {
        return 0;
      }
      const vaultBucket = item.bucket.vaultBucket;
      const usedSpace = item.bucket.vaultBucket
        ? count((this.items as DimItem[]), (i) => i.bucket.vaultBucket && (i.bucket.vaultBucket.id === vaultBucket.id))
        : 0;
      const openStacks = Math.max(0, this.capacityForItem(item) - usedSpace);
      const maxStackSize = item.maxStackSize || 1;
      if (maxStackSize === 1) {
        return openStacks;
      } else {
        const existingAmount = this.amountOfItem(item);
        const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
        return (openStacks * maxStackSize) + stackSpace;
      }
    },
    removeItem(item): DimItem {
      const result = StoreProto.removeItem.call(this, item);
      if (item.location.vaultBucket) {
        this.d2VaultCounts[item.location.vaultBucket.id].count--;
      }
      return result;
    },
    addItem(item: DimItem) {
      StoreProto.addItem.call(this, item);
      if (item.location.vaultBucket) {
        this.d2VaultCounts[item.location.vaultBucket.id].count++;
      }
    }
  });
}

/**
 * Compute character-level stats.
 */
function getCharacterStatsData(
  statDefs: LazyDefinition<DestinyStatDefinition>,
  stats: {
      [key: number]: number;
  }
): { [hash: number]: DimCharacterStat } {
  const statWhitelist = [2996146975, 392767087, 1943323491];
  const ret: { [hash: number]: DimCharacterStat } = {};

  // Fill in missing stats
  statWhitelist.forEach((statHash) => {
    const def = statDefs.get(statHash);
    const value = stats[statHash] || 0;
    const stat: DimCharacterStat = {
      id: statHash,
      name: def.displayProperties.name,
      description: def.displayProperties.description,
      value,
      icon: bungieNetPath(def.displayProperties.icon),
      tiers: [value],
      tierMax: 10,
      tier: 0
    };
    ret[statHash] = stat;
  });
  return ret;
}
