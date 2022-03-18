import { t } from 'app/i18next-t';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { D2ItemTiers } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { isD1Item, itemCanBeEquippedBy } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { Loadout } from './loadout-types';
import { convertToLoadoutItem, newLoadout, optimalItemSet, optimalLoadout } from './loadout-utils';

/**
 *  A dynamic loadout set up to level weapons and armor
 */
export function itemLevelingLoadout(allItems: DimItem[], store: DimStore): Loadout {
  const applicableItems = allItems.filter(
    (i) =>
      isD1Item(i) &&
      itemCanBeEquippedBy(i, store) &&
      i.talentGrid &&
      !i.talentGrid.xpComplete && // Still need XP
      i.hash !== 2168530918 && // Husk of the pit has a weirdo one-off xp mechanic
      i.hash !== 3783480580 &&
      i.hash !== 2576945954 &&
      i.hash !== 1425539750
  );

  const bestItemFn = (item: DimItem) => {
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

    value += D2ItemTiers[item.tier] * 10;

    // Choose the item w/ the highest XP
    if (isD1Item(item) && item.talentGrid) {
      value += 10 * (item.talentGrid.totalXP / item.talentGrid.totalXPRequired);
    }

    value += item.power / 1000;

    return value;
  };

  return optimalLoadout(applicableItems, bestItemFn, t('Loadouts.ItemLeveling'));
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightLoadout(allItems: DimItem[], store: DimStore): Loadout {
  const { equippable } = maxLightItemSet(allItems, store);
  const maxLightLoadout = newLoadout(
    store.destinyVersion === 2 ? t('Loadouts.MaximizePower') : t('Loadouts.MaximizeLight'),
    equippable.map((i) => convertToLoadoutItem(i, true)),
    store.classType
  );
  return maxLightLoadout;
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightItemSet(
  allItems: DimItem[],
  store: DimStore
): ReturnType<typeof optimalItemSet> {
  const applicableItems: DimItem[] = [];
  for (const i of allItems) {
    if (i.power && itemCanBeEquippedBy(i, store, true)) {
      applicableItems.push(i);
    }
  }

  const bestItemFn = (item: DimItem) => {
    let value = item.power;

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

  return optimalItemSet(applicableItems, bestItemFn);
}

/**
 * A loadout to maximize a specific stat
 */
export function maxStatLoadout(statHash: number, allItems: DimItem[], store: DimStore): Loadout {
  const applicableItems = allItems.filter(
    (i) =>
      i.power &&
      i.stats?.some((stat) => stat.statHash === statHash) && // contains our selected stat
      itemCanBeEquippedBy(i, store, true)
  );

  const bestItemFn = (item: DimItem) => {
    let value = item.stats!.find((stat) => stat.statHash === statHash)!.value;

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

  return optimalLoadout(applicableItems, bestItemFn, t('Loadouts.MaximizeStat'));
}

/**
 * A dynamic loadout set up to level weapons and armor
 */
export function gatherEngramsLoadout(
  allItems: DimItem[],
  options: { exotics: boolean } = { exotics: false }
): Loadout {
  const engrams = allItems.filter(
    (i) => i.isEngram && !i.location.inPostmaster && (options.exotics ? true : !i.isExotic)
  );

  if (engrams.length === 0) {
    let engramWarning = t('Loadouts.NoEngrams');
    if (options.exotics) {
      engramWarning = t('Loadouts.NoExotics');
    }
    throw new Error(engramWarning);
  }

  const itemsByType = _.mapValues(
    _.groupBy(engrams, (e) => e.bucket.hash),
    (items) => {
      // Sort exotic engrams to the end so they don't crowd out other types
      const sortedItems = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));
      // No more than 9 engrams of a type
      return _.take(sortedItems, 9);
    }
  );

  const finalItems = Object.values(itemsByType)
    .flat()
    .map((i) => convertToLoadoutItem(i, false));

  return newLoadout(t('Loadouts.GatherEngrams'), finalItems);
}

/**
 * Move a list of items to a store
 */
export function itemMoveLoadout(items: DimItem[], store: DimStore): Loadout {
  // Don't move things from the postmaster or that can't move
  items = items.filter((i) => !i.location.inPostmaster && !i.notransfer);
  items = addUpStackables(items);

  const itemsByType = _.mapValues(
    _.groupBy(items, (i) => i.bucket.hash),
    (items) => limitToBucketSize(items, store.isVault)
  );

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems = Object.values(itemsByType)
    .flat()
    .map((i) => convertToLoadoutItem(i, false));

  return newLoadout(t('Loadouts.FilteredItems'), finalItems);
}

function limitToBucketSize(items: DimItem[], isVault: boolean) {
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
  return Object.values(_.groupBy(items, (t) => t.hash)).flatMap((items) => {
    if (items[0].maxStackSize > 1) {
      const item = { ...items[0], amount: _.sumBy(items, (i) => i.amount) };
      return [item];
    } else {
      return items;
    }
  });
}

const randomLoadoutTypes = new Set<BucketHashes | D1BucketHashes>([
  BucketHashes.Subclass,
  BucketHashes.KineticWeapons,
  BucketHashes.EnergyWeapons,
  BucketHashes.PowerWeapons,
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
  D1BucketHashes.Artifact,
  BucketHashes.Ghost,
]);

/**
 * Create a random loadout from items across the whole inventory. Optionally filter items with the filter method.
 */
export function randomLoadout(store: DimStore, allItems: DimItem[], filter: ItemFilter) {
  // Any item equippable by this character in the given types
  const applicableItems = allItems.filter(
    (i) => randomLoadoutTypes.has(i.bucket.hash) && itemCanBeEquippedBy(i, store) && filter(i)
  );

  // Use "random" as the value function
  return optimalLoadout(applicableItems, () => Math.random(), t('Loadouts.Random'));
}
