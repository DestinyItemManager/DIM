import { copy } from 'angular';
import { t } from 'i18next';
import * as _ from 'underscore';
import { REP_TOKENS } from '../farming/rep-tokens';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { optimalLoadout } from './loadout-utils';
import { Loadout } from './loadout.service';

/**
 *  A dynamic loadout set up to level weapons and armor
 */
export function itemLevelingLoadout(storeService: StoreServiceType, store: DimStore): Loadout {
  const applicableItems = storeService.getAllItems().filter((i) => {
    return i.canBeEquippedBy(store) &&
      i.talentGrid &&
      !(i.talentGrid as any).xpComplete && // Still need XP
      (i.hash !== 2168530918 && // Husk of the pit has a weirdo one-off xp mechanic
      i.hash !== 3783480580 &&
      i.hash !== 2576945954 &&
      i.hash !== 1425539750);
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
    // and apply different rules to them.
    if (item.locked) {
      value += 500;
      value += [
        'Common',
        'Uncommon',
        'Rare',
        'Legendary',
        'Exotic'
      ].indexOf(item.tier) * 10;
    } else {
      // For unlocked, prefer blue items so when you destroy them you get more mats.
      value += [
        'Common',
        'Uncommon',
        'Exotic',
        'Legendary',
        'Rare'
      ].indexOf(item.tier) * 10;
    }

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
    return i.canBeEquippedBy(store) &&
      i.primStat && // has a primary stat (sanity check)
      statHashes.has(i.primStat.statHash); // one of our selected stats
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
  const engrams = _.filter(storeService.getAllItems(), (i) => {
    return i.isEngram() && !i.location.inPostmaster && (options.exotics ? true : !i.isExotic);
  });

  if (engrams.length === 0) {
    let engramWarning = t('Loadouts.NoEngrams');
    if (options.exotics) {
      engramWarning = t('Loadouts.NoExotics');
    }
    throw new Error(engramWarning);
  }

  const itemsByType = _.mapObject(_.groupBy(engrams, 'type'), (items) => {
    // Sort exotic engrams to the end so they don't crowd out other types
    items = _.sortBy(items, (i) => {
      return i.isExotic ? 1 : 0;
    });
    // No more than 9 engrams of a type
    return _.first(items, 9);
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

  return {
    classType: -1,
    name: t('Loadouts.GatherEngrams'),
    items: finalItems
  };
}

export function gatherTokensLoadout(storeService: StoreServiceType): Loadout {
  const tokens = _.filter(storeService.getAllItems(), (i) => {
    return REP_TOKENS.has(i.hash) && !i.notransfer;
  });

  if (tokens.length === 0) {
    throw new Error(t('Loadouts.NoTokens'));
  }

  const itemsByType = _.groupBy(tokens, 'type');

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems = {};
  _.each(itemsByType, (items, type) => {
    if (items) {
      finalItems[type.toLowerCase()] = items.map((i) => {
        return copy(i);
      });
    }
  });

  return {
    classType: -1,
    name: t('Loadouts.GatherTokens'),
    items: finalItems
  };
}

/**
 * Move items matching the current search. Max 9 per type.
 */
export function searchLoadout(storeService: StoreServiceType, store: DimStore): Loadout {
  const items = _.filter(storeService.getAllItems(), (i) => {
    return i.visible &&
      !i.location.inPostmaster &&
      !i.notransfer;
  });

  const itemsByType = _.mapObject(_.groupBy(items, 'type'), (items) => {
    return store.isVault ? items : _.first(items, 9);
  });

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

  return {
    classType: -1,
    name: t('Loadouts.FilteredItems'),
    items: finalItems
  };
}
