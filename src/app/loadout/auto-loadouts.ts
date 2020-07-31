import copy from 'fast-copy';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { optimalLoadout, newLoadout, convertToLoadoutItem, optimalItemSet } from './loadout-utils';
import { DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { Loadout } from './loadout-types';
import { getAllItems, getCurrentStore } from 'app/inventory/stores-helpers';
import { StatHashes } from 'data/d2/generated-enums';

/**
 *  A dynamic loadout set up to level weapons and armor
 */
export function itemLevelingLoadout(stores: DimStore[], store: DimStore): Loadout {
  const applicableItems = getAllItems(
    stores,
    (i) =>
      i.canBeEquippedBy(store) &&
      i.talentGrid &&
      !(i.talentGrid as any).xpComplete && // Still need XP
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

    value += ['Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'].indexOf(item.tier) * 10;

    // Choose the item w/ the highest XP
    if (item.isDestiny1() && item.talentGrid) {
      value += 10 * (item.talentGrid.totalXP / item.talentGrid.totalXPRequired);
    }

    value += item.primStat ? item.primStat.value / 1000 : 0;

    return value;
  };

  return optimalLoadout(applicableItems, bestItemFn, t('Loadouts.ItemLeveling'));
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightLoadout(stores: DimStore[], store: DimStore): Loadout {
  const { equippable } = maxLightItemSet(stores, store);
  return newLoadout(
    name,
    equippable.map((i) => convertToLoadoutItem(i, true))
  );
}

const powerStatHashes = [
  StatHashes.Attack, // D2 Attack
  StatHashes.Defense, // D1 & D2 Defense
  368428387, // D1 Attack
];

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightItemSet(
  stores: DimStore[],
  store: DimStore
): ReturnType<typeof optimalItemSet> {
  const applicableItems: DimItem[] = [];
  for (const s of stores) {
    for (const i of s.items) {
      if (
        (i.canBeEquippedBy(store) ||
          (i.location.inPostmaster &&
            (i.classType === DestinyClass.Unknown || i.classType === store.classType) &&
            // nothing we are too low-level to equip
            i.equipRequiredLevel <= store.level)) &&
        i.primStat?.value && // has a primary stat (sanity check)
        powerStatHashes.includes(i.primStat.statHash) // one of our selected stats
      ) {
        applicableItems.push(i);
      }
    }
  }

  const bestItemFn = (item: DimItem) => {
    let value = item.primStat!.value;

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
export function maxStatLoadout(statHash: number, stores: DimStore[], store: DimStore): Loadout {
  const applicableItems = getAllItems(
    stores,
    (i) =>
      (i.canBeEquippedBy(store) ||
        (i.location.inPostmaster &&
          (i.classType === DestinyClass.Unknown || i.classType === store.classType) &&
          // nothing we are too low-level to equip
          i.equipRequiredLevel <= store.level)) &&
      i.primStat?.value && // has a primary stat (sanity check)
      i.stats &&
      i.stats.some((stat) => stat.statHash === statHash) // contains our selected stat
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
  stores: DimStore[],
  options: { exotics: boolean } = { exotics: false }
): Loadout {
  const engrams = getAllItems(
    stores,
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
    _.groupBy(engrams, (e) => e.type),
    (items) => {
      // Sort exotic engrams to the end so they don't crowd out other types
      items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));
      // No more than 9 engrams of a type
      return _.take(items, 9);
    }
  );

  const finalItems = Object.values(itemsByType)
    .flat()
    .map((i) => convertToLoadoutItem(i, false));

  return newLoadout(t('Loadouts.GatherEngrams'), finalItems);
}

/**
 * Move items matching the current search.
 */
export function searchLoadout(
  stores: DimStore[],
  store: DimStore,
  searchFilter: (item: DimItem) => boolean
): Loadout {
  let items = getAllItems(
    stores,
    (i) => !i.location.inPostmaster && !i.notransfer && searchFilter(i)
  );

  items = addUpStackables(items);

  const itemsByType = _.mapValues(
    _.groupBy(items, (i) => i.type),
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
      const item = copy(items[0]);
      item.amount = _.sumBy(items, (i) => i.amount);
      return [item];
    } else {
      return items;
    }
  });
}

const randomLoadoutTypes = new Set([
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
  'Ghost',
]);

/**
 * Create a random loadout from items across the whole inventory. Optionally filter items with the filter method.
 */
export function randomLoadout(stores: DimStore[], filter: (i: DimItem) => boolean) {
  const currentCharacter = getCurrentStore(stores);
  if (!currentCharacter) {
    return null;
  }

  // Any item equippable by this character in the given types
  const applicableItems = getAllItems(
    stores,
    (i) => randomLoadoutTypes.has(i.type) && i.canBeEquippedBy(currentCharacter) && filter(i)
  );

  // Use "random" as the value function
  return optimalLoadout(applicableItems, () => Math.random(), t('Loadouts.Random'));
}
