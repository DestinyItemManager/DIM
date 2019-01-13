import copy from 'fast-copy';
import { t } from 'i18next';
import * as _ from 'lodash';
import { optimalLoadout, newLoadout } from './loadout-utils';
import { Loadout } from './loadout.service';
import { StoreServiceType, DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';

/**
 *  A dynamic loadout set up to level weapons and armor
 */
export function itemLevelingLoadout(storeService: StoreServiceType, store: DimStore): Loadout {
  const applicableItems = storeService.getAllItems().filter((i) => {
    return (
      i.canBeEquippedBy(store) &&
      i.talentGrid &&
      !(i.talentGrid as any).xpComplete && // Still need XP
      (i.hash !== 2168530918 && // Husk of the pit has a weirdo one-off xp mechanic
        i.hash !== 3783480580 &&
        i.hash !== 2576945954 &&
        i.hash !== 1425539750)
    );
  });

  const bestItemFn = (item) => {
    let value = 0;

    if (item.owner === store.id) {
      // Prefer items owned by this character
      value += 0.5;
      // Leave equipped items alone if they need XP, and on the current character
      if (item.equipped) {
        return 1000;
      }
    } else if (item.owner === 'vault') {
      // Prefer items in the vault over items owned by a different character
      // (but not as much as items owned by this character)
      value += 0.05;
    }

    // Prefer locked items (they're stuff you want to use/keep)
    if (item.locked) {
      value += 500;
    }

    value += ['Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'].indexOf(item.tier) * 10;

    // Choose the item w/ the highest XP
    value += 10 * (item.talentGrid.totalXP / item.talentGrid.totalXPRequired);

    value += item.primStat ? item.primStat.value / 1000 : 0;

    return value;
  };

  return optimalLoadout(applicableItems, bestItemFn, t('Loadouts.ItemLeveling'));
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightLoadout(storeService: StoreServiceType, store: DimStore): Loadout {
  const statHashes = new Set([
    1480404414, // D2 Attack
    3897883278, // D1 & D2 Defense
    368428387 // D1 Attack
  ]);

  const applicableItems = storeService.getAllItems().filter((i) => {
    return (
      i.canBeEquippedBy(store) &&
      i.primStat && // has a primary stat (sanity check)
      statHashes.has(i.primStat.statHash)
    ); // one of our selected stats
  });

  const bestItemFn = (item) => {
    let value = item.primStat.value;

    // Break ties when items have the same stats. Note that this should only
    // add less than 0.25 total, since in the exotics special case there can be
    // three items in consideration and you don't want to go over 1 total.
    if (item.owner === store.id) {
      // Prefer items owned by this character
      value += 0.1;
      if (item.equipped) {
        // Prefer them even more if they're already equipped
        value += 0.1;
      }
    } else if (item.owner === 'vault') {
      // Prefer items in the vault over items owned by a different character
      // (but not as much as items owned by this character)
      value += 0.05;
    }
    return value;
  };

  return optimalLoadout(applicableItems, bestItemFn, t('Loadouts.MaximizeLight'));
}

/**
 * A dynamic loadout set up to level weapons and armor
 */
export function gatherEngramsLoadout(
  storeService: StoreServiceType,
  options: { exotics: boolean } = { exotics: false }
): Loadout {
  const engrams = storeService.getAllItems().filter((i) => {
    return i.isEngram && !i.location.inPostmaster && (options.exotics ? true : !i.isExotic);
  });

  if (engrams.length === 0) {
    let engramWarning = t('Loadouts.NoEngrams');
    if (options.exotics) {
      engramWarning = t('Loadouts.NoExotics');
    }
    throw new Error(engramWarning);
  }

  const itemsByType = _.mapValues(_.groupBy(engrams, (e) => e.type), (items) => {
    // Sort exotic engrams to the end so they don't crowd out other types
    items = _.sortBy(items, (i) => {
      return i.isExotic ? 1 : 0;
    });
    // No more than 9 engrams of a type
    return _.take(items, 9);
  });

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems = {};
  _.each(itemsByType, (items, type) => {
    if (items) {
      finalItems[type.toLowerCase()] = items.map((i) => {
        return copy(i);
      });
    }
  });

  return newLoadout(t('Loadouts.GatherEngrams'), finalItems);
}

export function gatherTokensLoadout(storeService: StoreServiceType): Loadout {
  let tokens = storeService.getAllItems().filter((i) => {
    return i.isDestiny2() && i.itemCategoryHashes.includes(2088636411) && !i.notransfer;
  });

  if (tokens.length === 0) {
    throw new Error(t('Loadouts.NoTokens'));
  }

  tokens = addUpStackables(tokens);

  const itemsByType = _.groupBy(tokens, (t) => t.type);

  // Copy the items and put them in arrays, so they look like a loadout
  const finalItems = {};
  _.each(itemsByType, (items, type) => {
    if (items) {
      finalItems[type.toLowerCase()] = items;
    }
  });

  return newLoadout(t('Loadouts.GatherTokens'), finalItems);
}

/**
 * Move items matching the current search.
 */
export function searchLoadout(
  storeService: StoreServiceType,
  store: DimStore,
  searchFilter: (item: DimItem) => boolean
): Loadout {
  let items = storeService.getAllItems().filter((i) => {
    return !i.location.inPostmaster && !i.notransfer && searchFilter(i);
  });

  items = addUpStackables(items);

  const itemsByType = _.mapValues(_.groupBy(items, (i) => i.type), (items) =>
    limitToBucketSize(items, store.isVault)
  );

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems = {};
  _.each(itemsByType, (items, type) => {
    if (items) {
      finalItems[type.toLowerCase()] = items.map((i) => {
        const copiedItem = copy(i);
        copiedItem.equipped = false;
        return copiedItem;
      });
    }
  });

  return newLoadout(t('Loadouts.FilteredItems'), finalItems);
}

function limitToBucketSize(items: DimItem[], isVault) {
  if (!items.length) {
    return [];
  }
  const item = items[0];

  if (!item.bucket) {
    return isVault ? items : _.take(items, 9);
  }
  const bucket = isVault ? item.bucket.vaultBucket : item.bucket;

  if (!bucket) {
    return isVault ? items : _.take(items, 9);
  }
  // TODO: this doesn't take into account stacks that need to split
  return _.take(items, bucket.capacity - (item.equipment ? 1 : 0));
}

// Add up stackable items so we don't have duplicates. This helps us actually move them, see
// https://github.com/DestinyItemManager/DIM/issues/2691#issuecomment-373970255
function addUpStackables(items: DimItem[]) {
  return _.flatMap(Object.values(_.groupBy(items, (t) => t.hash)), (items) => {
    if (items[0].maxStackSize > 1) {
      const item = copy(items[0]);
      item.amount = _.sumBy(items, (i) => i.amount);
      return [item];
    } else {
      return items;
    }
  });
}

export function randomLoadout(storeService: StoreServiceType, weaponsOnly = false) {
  const store = storeService.getActiveStore();
  if (!store) {
    return null;
  }

  const types = new Set(
    weaponsOnly
      ? ['Class', 'Primary', 'Special', 'Heavy', 'Kinetic', 'Energy', 'Power']
      : [
          'Class',
          'Primary',
          'Special',
          'Heavy',
          'Kinetic',
          'Energy',
          'Power',
          'Helmet',
          'Gauntlets',
          'Chest',
          'Leg',
          'ClassItem',
          'Artifact',
          'Ghost'
        ]
  );

  // Any item equippable by this character in the given types
  const applicableItems = storeService
    .getAllItems()
    .filter((i) => types.has(i.type) && i.canBeEquippedBy(store));

  // Use "random" as the value function
  return optimalLoadout(applicableItems, () => Math.random(), t('Loadouts.Random'));
}
