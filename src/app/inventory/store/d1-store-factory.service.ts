import * as _ from 'lodash';
import { count } from '../../util';
import { getCharacterStatsData, getClass } from './character-utils';
import { getDefinitions, D1ManifestDefinitions } from '../../destiny1/d1-definitions.service';
import copy from 'fast-copy';
import { t } from 'i18next';
import vaultBackground from 'app/images/vault-background.svg';
import vaultIcon from 'app/images/vault.svg';
import { D1Store, D1Vault } from '../store-types';
import { D1Item } from '../item-types';
import { D1StoresService } from '../d1-stores.service';
import { newLoadout } from '../../loadout/loadout-utils';

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
  2576753410: { label: 'SRL', order: 11 }
};

const factionBadges = {
  969832704: 'Future War Cult',
  27411484: 'Dead Orbit',
  2954371221: 'New Monarchy'
};

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
  amountOfItem(this: D1Store, item: D1Item) {
    return _.sumBy(
      this.items.filter((i) => {
        return i.hash === item.hash && !i.location.inPostmaster;
      }),
      (i) => i.amount
    );
  },

  /**
   * How much of items like this item can fit in this store? For
   * stackables, this is in stacks, not individual pieces.
   */
  capacityForItem(this: D1Store, item: D1Item) {
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
  spaceLeftForItem(this: D1Store, item: D1Item) {
    if (!item.type) {
      throw new Error("item needs a 'type' field");
    }
    const openStacks = Math.max(
      0,
      this.capacityForItem(item) - this.buckets[item.location.id].length
    );
    const maxStackSize = item.maxStackSize || 1;
    if (maxStackSize === 1) {
      return openStacks;
    } else {
      const existingAmount = this.amountOfItem(item);
      const stackSpace = existingAmount > 0 ? maxStackSize - (existingAmount % maxStackSize) : 0;
      return openStacks * maxStackSize + stackSpace;
    }
  },

  updateCharacterInfoFromEquip(this: D1Store, characterInfo) {
    getDefinitions().then((defs) => this.updateCharacterInfo(defs, characterInfo));
  },

  updateCharacterInfo(this: D1Store, defs: D1ManifestDefinitions, characterInfo) {
    this.level = characterInfo.characterLevel;
    this.percentToNextLevel = characterInfo.percentToNextLevel / 100;
    this.powerLevel = characterInfo.characterBase.powerLevel;
    this.background = `https://www.bungie.net/${characterInfo.backgroundPath}`;
    this.icon = `https://www.bungie.net/${characterInfo.emblemPath}`;
    this.stats = getCharacterStatsData(defs.Stat, characterInfo.characterBase);
  },

  // Remove an item from this store. Returns whether it actually removed anything.
  removeItem(this: D1Store, item: D1Item) {
    // Completely remove the source item
    const match = (i: D1Item) => item.index === i.index;
    const sourceIndex = this.items.findIndex(match);
    if (sourceIndex >= 0) {
      this.items = [...this.items.slice(0, sourceIndex), ...this.items.slice(sourceIndex + 1)];

      let bucketItems = this.buckets[item.location.id];
      const bucketIndex = bucketItems.findIndex(match);
      bucketItems = [...bucketItems.slice(0, bucketIndex), ...bucketItems.slice(bucketIndex + 1)];
      this.buckets[item.location.id] = bucketItems;

      return true;
    }
    return false;
  },

  addItem(this: D1Store, item: D1Item) {
    this.items = [...this.items, item];
    this.buckets[item.location.id] = [...this.buckets[item.location.id], item];
    item.owner = this.id;
  },

  // Create a loadout from this store's equipped items
  loadoutFromCurrentlyEquipped(this: D1Store, name: string) {
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    const allItems = this.items.filter((item) => item.canBeInLoadout()).map((item) => copy(item));
    return newLoadout(name, _.groupBy(allItems, (i) => i.type.toLowerCase()));
  },

  factionAlignment(this: D1Store) {
    const badge = this.buckets.BUCKET_MISSION.find((i) => factionBadges[i.hash]);
    if (!badge) {
      return null;
    }

    return factionBadges[badge.hash];
  },

  isDestiny1(this: D1Store) {
    return true;
  },

  isDestiny2(this: D1Store) {
    return false;
  },

  getStoresService() {
    return D1StoresService;
  }
};

export interface D1Currencies {
  glimmer: number;
  marks: number;
  silver: number;
}

export function makeCharacter(
  raw,
  defs: D1ManifestDefinitions,
  mostRecentLastPlayed: Date,
  currencies: D1Currencies
): {
  store: D1Store;
  items: any[];
} {
  const character = raw.character.base;
  try {
    currencies.glimmer = character.inventory.currencies.find(
      (cur) => cur.itemHash === 3159615086
    ).value;
    currencies.marks = character.inventory.currencies.find(
      (cur) => cur.itemHash === 2534352370
    ).value;
    currencies.silver = character.inventory.currencies.find(
      (cur) => cur.itemHash === 2749350776
    ).value;
  } catch (e) {
    console.log('error', e);
  }

  const race = defs.Race[character.characterBase.raceHash];
  let genderRace = '';
  let className = '';
  let gender = '';
  if (character.characterBase.genderType === 0) {
    gender = 'male';
    genderRace = race.raceNameMale;
    className = defs.Class[character.characterBase.classHash].classNameMale;
  } else {
    gender = 'female';
    genderRace = race.raceNameFemale;
    className = defs.Class[character.characterBase.classHash].classNameFemale;
  }

  const lastPlayed = new Date(character.characterBase.dateLastPlayed);

  const store: D1Store = Object.assign(Object.create(StoreProto), {
    destinyVersion: 1,
    id: raw.id,
    name: `${genderRace} ${className}`,
    icon: `https://www.bungie.net/${character.emblemPath}`,
    current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
    lastPlayed,
    background: `https://www.bungie.net/${character.backgroundPath}`,
    level: character.characterLevel,
    powerLevel: character.characterBase.powerLevel,
    stats: getCharacterStatsData(defs.Stat, character.characterBase),
    class: getClass(character.characterBase.classType),
    classType: character.characterBase.classType,
    className,
    gender,
    genderRace,
    percentToNextLevel: character.percentToNextLevel / 100,
    progression: raw.character.progression,
    advisors: raw.character.advisors,
    isVault: false
  });

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
  _.each(raw.data.buckets, (bucket: any) => {
    _.each(bucket, (pail: any) => {
      _.each(pail.items, (item: any) => {
        item.bucket = pail.bucketHash;
      });

      items = items.concat(pail.items);
    });
  });

  if (_.has(character.inventory.buckets, 'Invisible')) {
    _.each(character.inventory.buckets.Invisible, (pail: any) => {
      _.each(pail.items, (item: any) => {
        item.bucket = pail.bucketHash;
      });

      items = items.concat(pail.items);
    });
  }

  return {
    store,
    items
  };
}

export function makeVault(
  raw,
  currencies: D1Currencies
): {
  store: D1Vault;
  items: any[];
} {
  const store: D1Vault = Object.assign(Object.create(StoreProto), {
    destinyVersion: 1,
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
    capacityForItem(this: D1Vault, item: D1Item) {
      if (!item.bucket) {
        throw new Error("item needs a 'bucket' field");
      }
      const vaultBucket = item.bucket.vaultBucket;
      return vaultBucket ? vaultBucket.capacity : 0;
    },
    spaceLeftForItem(this: D1Vault, item: D1Item) {
      let sort = item.sort;
      if (item.bucket && item.bucket.sort) {
        sort = item.bucket.sort;
      }
      if (!sort) {
        throw new Error("item needs a 'sort' field");
      }
      const openStacks = Math.max(
        0,
        this.capacityForItem(item) - count(this.items, (i) => i.bucket.sort === sort)
      );
      const maxStackSize = item.maxStackSize || 1;
      if (maxStackSize === 1) {
        return openStacks;
      } else {
        const existingAmount = this.amountOfItem(item);
        const stackSpace = existingAmount > 0 ? maxStackSize - (existingAmount % maxStackSize) : 0;
        return openStacks * maxStackSize + stackSpace;
      }
    },
    removeItem(this: D1Vault, item: D1Item) {
      const result = StoreProto.removeItem.call(this, item);
      if (item.location.vaultBucket) {
        this.vaultCounts[item.location.vaultBucket.id].count--;
      }
      return result;
    },
    addItem(this: D1Vault, item: D1Item) {
      StoreProto.addItem.call(this, item);
      if (item.location.vaultBucket) {
        this.vaultCounts[item.location.vaultBucket.id].count++;
      }
    }
  });

  let items: any[] = [];

  _.each(raw.data.buckets, (bucket: any) => {
    _.each(bucket.items, (item: any) => {
      item.bucket = bucket.bucketHash;
    });

    items = items.concat(bucket.items);
  });

  return {
    store,
    items
  };
}
