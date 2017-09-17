import angular from 'angular';
import _ from 'underscore';
import uuidv4 from 'uuid/v4';
import { sum, count } from '../../util';
import { getClass } from './character-utils';

/**
 * A factory service for producing "stores" (characters or the vault).
 * The job of filling in their items is left to other code - this is just the basic store itself.
 */
export function D2StoreFactory($i18next, dimInfoService) {
  'ngInject';

  // Prototype for Store objects - add methods to this to add them to all
  // stores.
  const StoreProto = {
    /**
     * Get the total amount of this item in the store, across all stacks,
     * excluding stuff in the postmaster.
     */
    amountOfItem: function(item) {
      return sum(this.items.filter((i) => {
        return i.hash === item.hash && !i.location.inPostmaster;
      }), 'amount');
    },

    /**
     * How much of items like this item can fit in this store? For
     * stackables, this is in stacks, not individual pieces.
     */
    capacityForItem: function(item) {
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
    spaceLeftForItem: function(item) {
      if (!item.type) {
        throw new Error("item needs a 'type' field");
      }
      const openStacks = Math.max(0, this.capacityForItem(item) -
                                  this.buckets[item.location.id].length);
      const maxStackSize = item.maxStackSize || 1;
      if (maxStackSize === 1) {
        return openStacks;
      } else {
        const existingAmount = this.amountOfItem(item);
        const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
        return (openStacks * maxStackSize) + stackSpace;
      }
    },

    updateCharacterInfo: function(defs, character) {
      this.level = character.levelProgression.level; // Maybe?
      this.powerLevel = character.light;
      this.maxPowerMinusMods = character.stats[1885944937];
      this.background = `https://www.bungie.net/${character.emblemBackgroundPath}`;
      this.icon = `https://www.bungie.net/${character.emblemPath}`;
      // this.stats = getCharacterStatsData(defs.Stat, characterInfo.characterBase);
    },

    // Remove an item from this store. Returns whether it actually removed anything.
    removeItem: function(item) {
      // Completely remove the source item
      const match = (i) => item.index === i.index;
      const sourceIndex = this.items.findIndex(match);
      if (sourceIndex >= 0) {
        this.items.splice(sourceIndex, 1);

        const bucketItems = this.buckets[item.location.id];
        const bucketIndex = bucketItems.findIndex(match);
        bucketItems.splice(bucketIndex, 1);

        return true;
      }
      return false;
    },

    addItem: function(item) {
      this.items.push(item);
      const bucketItems = this.buckets[item.location.id];
      bucketItems.push(item);
      if (item.location.id === 'BUCKET_RECOVERY' && bucketItems.length >= item.location.capacity) {
        dimInfoService.show('lostitems', {
          type: 'warning',
          title: $i18next.t('Postmaster.Limit'),
          body: $i18next.t('Postmaster.Desc', { store: this.name }),
          hide: $i18next.t('Help.NeverShow')
        });
      }
      item.owner = this.id;
    },

    // Create a loadout from this store's equipped items
    loadoutFromCurrentlyEquipped: function(name) {
      const allItems = this.items
        .filter((item) => item.canBeInLoadout())
        .map((i) => angular.copy(i));
      return {
        id: uuidv4(),
        classType: -1,
        name: name,
        items: _.groupBy(allItems, (i) => i.type.toLowerCase())
      };
    },

    factionAlignment: function() {
      return null;
    }
  };

  return {
    makeCharacter(defs, character, mostRecentLastPlayed) {
      const race = defs.Race[character.raceHash];
      const gender = defs.Gender[character.genderHash];
      const classy = defs.Class[character.classHash];
      const genderRace = race.genderedRaceNames[gender.genderType === 1 ? 'Female' : 'Male'];
      const className = classy.genderedClassNames[gender.genderType === 1 ? 'Female' : 'Male'];
      const genderName = gender.displayProperties.name;
      const lastPlayed = new Date(character.dateLastPlayed);

      const store = angular.extend(Object.create(StoreProto), {
        destinyVersion: 2,
        id: character.characterId,
        icon: `https://www.bungie.net/${character.emblemPath}`,
        current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
        lastPlayed,
        background: `https://www.bungie.net/${character.emblemBackgroundPath}`,
        level: character.levelProgression.level, // Maybe?
        powerLevel: character.light,
        maxPowerMinusMods: character.stats[1885944937],
        // stats: getCharacterStatsData(defs.Stat, character.characterBase),
        class: getClass(classy.classType),
        classType: classy.classType,
        className: className,
        gender: genderName,
        genderRace: genderRace,
        isVault: false
      });

      store.name = `${store.genderRace} ${store.className}`;

      return store;
    },

    makeVault(buckets, profileCurrencies) {
      // TODO: get this right
      const glimmer = _.find(profileCurrencies, (cur) => cur.itemHash === 3159615086);
      const legendary = _.find(profileCurrencies, (cur) => cur.itemHash === 1022552290);
      const currencies = {
        glimmer: glimmer ? glimmer.quantity : 0,
        marks: legendary ? legendary.quantity : 0
        // silver: _.find(profileCurrencies, (cur) => { return cur.itemHash === 2749350776; }).quantity
      };

      return angular.extend(Object.create(StoreProto), {
        destinyVersion: 2,
        id: 'vault',
        name: $i18next.t('Bucket.Vault'),
        class: 'vault',
        current: false,
        className: $i18next.t('Bucket.Vault'),
        lastPlayed: new Date('2005-01-01T12:00:01Z'),
        icon: require('app/images/vault.png'),
        background: require('app/images/vault-background.png'),
        items: [],
        legendaryMarks: currencies.marks,
        glimmer: currencies.glimmer,
        silver: currencies.silver,
        isVault: true,
        // Vault has different capacity rules
        capacityForItem: function(item) {
          if (!item.bucket) {
            throw new Error("item needs a 'bucket' field");
          }
          return buckets.byHash[item.bucket.hash].vaultBucket.capacity;
        },
        spaceLeftForItem: function(item) {
          let sort = item.sort;
          if (item.bucket) {
            sort = item.bucket.sort;
          }
          if (!sort) {
            throw new Error("item needs a 'sort' field");
          }
          const openStacks = Math.max(0, this.capacityForItem(item) -
                                      count(this.items, (i) => i.bucket.sort === sort));
          const maxStackSize = item.maxStackSize || 1;
          if (maxStackSize === 1) {
            return openStacks;
          } else {
            const existingAmount = this.amountOfItem(item);
            const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
            return (openStacks * maxStackSize) + stackSpace;
          }
        },
        removeItem: function(item) {
          const result = StoreProto.removeItem.call(this, item);
          this.vaultCounts[item.location.sort]--;
          return result;
        },
        addItem: function(item) {
          StoreProto.addItem.call(this, item);
          this.vaultCounts[item.location.sort]++;
        }
      });
    }
  };
}
