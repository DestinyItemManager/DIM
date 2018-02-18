import angular from 'angular';
import _ from 'underscore';
import uuidv4 from 'uuid/v4';
import { sum, count } from '../../util';
import { getCharacterStatsData, getClass } from './character-utils';
import { getDefinitions } from '../../destiny1/d1-definitions.service';
import { showInfoPopup } from '../../services/dimInfoService.factory';

// Label isn't used, but it helps us understand what each one is
const progressionMeta = {
  529303302: { label: "Cryptarch", order: 0 },
  3233510749: { label: "Vanguard", order: 1 },
  1357277120: { label: "Crucible", order: 2 },
  2778795080: { label: "Dead Orbit", order: 3 },
  1424722124: { label: "Future War Cult", order: 4 },
  3871980777: { label: "New Monarchy", order: 5 },
  2161005788: { label: "Iron Banner", order: 6 },
  174528503: { label: "Crota's Bane", order: 7 },
  807090922: { label: "Queen's Wrath", order: 8 },
  3641985238: { label: "House of Judgment", order: 9 },
  2335631936: { label: "Gunsmith", order: 10 },
  2576753410: { label: "SRL", order: 11 }
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
export function StoreFactory($i18next) {
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

    updateCharacterInfoFromEquip: function(characterInfo) {
      getDefinitions().then((defs) => this.updateCharacterInfo(defs, characterInfo));
    },

    updateCharacterInfo: function(defs, characterInfo) {
      this.level = characterInfo.characterLevel;
      this.percentToNextLevel = characterInfo.percentToNextLevel / 100.0;
      this.powerLevel = characterInfo.characterBase.powerLevel;
      this.background = `https://www.bungie.net/${characterInfo.backgroundPath}`;
      this.icon = `https://www.bungie.net/${characterInfo.emblemPath}`;
      this.stats = getCharacterStatsData(defs.Stat, characterInfo.characterBase);
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
        showInfoPopup('lostitems', {
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
      const badge = this.buckets.BUCKET_MISSION.find((i) => factionBadges[i.hash]);
      if (!badge) {
        return null;
      }

      return factionBadges[badge.hash];
    }
  };

  return {
    makeCharacter(raw, defs, mostRecentLastPlayed, currencies) {
      let items = [];
      const character = raw.character.base;
      try {
        currencies.glimmer = _.find(character.inventory.currencies, (cur) => { return cur.itemHash === 3159615086; }).value;
        currencies.marks = _.find(character.inventory.currencies, (cur) => { return cur.itemHash === 2534352370; }).value;
        currencies.silver = _.find(character.inventory.currencies, (cur) => { return cur.itemHash === 2749350776; }).value;
      } catch (e) {
        console.log("error", e);
      }

      const race = defs.Race[character.characterBase.raceHash];
      let genderRace = "";
      let className = "";
      let gender = "";
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

      const store = angular.extend(Object.create(StoreProto), {
        destinyVersion: 1,
        id: raw.id,
        icon: `https://www.bungie.net/${character.emblemPath}`,
        current: mostRecentLastPlayed.getTime() === lastPlayed.getTime(),
        lastPlayed,
        background: `https://www.bungie.net/${character.backgroundPath}`,
        level: character.characterLevel,
        powerLevel: character.characterBase.powerLevel,
        stats: getCharacterStatsData(defs.Stat, character.characterBase),
        class: getClass(character.characterBase.classType),
        classType: character.characterBase.classType,
        className: className,
        gender: gender,
        genderRace: genderRace,
        percentToNextLevel: character.percentToNextLevel / 100.0,
        progression: raw.character.progression,
        advisors: raw.character.advisors,
        isVault: false
      });

      store.name = `${store.genderRace} ${store.className}`;

      if (store.progression) {
        store.progression.progressions.forEach((prog) => {
          angular.extend(prog, defs.Progression.get(prog.progressionHash), progressionMeta[prog.progressionHash]);
          const faction = _.find(defs.Faction, { progressionHash: prog.progressionHash });
          if (faction) {
            prog.faction = faction;
          }
        });
      }

      _.each(raw.data.buckets, (bucket) => {
        _.each(bucket, (pail) => {
          _.each(pail.items, (item) => {
            item.bucket = pail.bucketHash;
          });

          items = items.concat(pail.items);
        });
      });

      if (_.has(character.inventory.buckets, 'Invisible')) {
        _.each(character.inventory.buckets.Invisible, (pail) => {
          _.each(pail.items, (item) => {
            item.bucket = pail.bucketHash;
          });

          items = items.concat(pail.items);
        });
      }

      return {
        store,
        items
      };
    },

    makeVault(raw, buckets, currencies) {
      let items = [];
      const store = angular.extend(Object.create(StoreProto), {
        destinyVersion: 1,
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
          let sort = item.sort;
          if (item.bucket) {
            sort = item.bucket.sort;
          }
          if (!sort) {
            throw new Error("item needs a 'sort' field");
          }
          return buckets[sort].capacity;
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

      _.each(raw.data.buckets, (bucket) => {
        _.each(bucket.items, (item) => {
          item.bucket = bucket.bucketHash;
        });

        items = items.concat(bucket.items);
      });

      return {
        store,
        items
      };
    }
  };
}