import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { D2ItemTiers } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { isD1Item, itemCanBeEquippedBy } from 'app/utils/item-utils';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  getSocketsByCategoryHashes,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem, DimSocket } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { Loadout } from '../loadout/loadout-types';
import {
  convertToLoadoutItem,
  getLoadoutSubclassFragmentCapacity,
  newLoadout,
  optimalItemSet,
  optimalLoadout,
} from './loadout-utils';

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
      i.hash !== 1425539750,
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

  return optimalLoadout(applicableItems, store, bestItemFn, t('Loadouts.ItemLeveling'));
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightLoadout(allItems: DimItem[], store: DimStore): Loadout {
  const { equippable } = maxLightItemSet(allItems, store);
  const maxLightLoadout = newLoadout(
    store.destinyVersion === 2 ? t('Loadouts.MaximizePower') : t('Loadouts.MaximizeLight'),
    equippable.map((i) => convertToLoadoutItem(i, true)),
    store.classType,
  );
  return maxLightLoadout;
}

/**
 * A loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
 */
export function maxLightItemSet(
  allItems: DimItem[],
  store: DimStore,
): ReturnType<typeof optimalItemSet> {
  const applicableItems: DimItem[] = [];
  for (const i of allItems) {
    if ((i.power && i.bucket.inWeapons) || i.bucket.inArmor) {
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

  return optimalItemSet(applicableItems, store, bestItemFn);
}

/**
 * A loadout to maximize a specific stat
 */
export function maxStatLoadout(statHash: number, allItems: DimItem[], store: DimStore): Loadout {
  const applicableItems = allItems.filter(
    (i) =>
      i.power &&
      i.stats?.some((stat) => stat.statHash === statHash) && // contains our selected stat
      itemCanBeEquippedBy(i, store, true),
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

  return optimalLoadout(applicableItems, store, bestItemFn, t('Loadouts.MaximizeStat'));
}

/**
 * Move a list of items to a store
 */
export function itemMoveLoadout(items: DimItem[], store: DimStore): Loadout {
  // Don't move things from the postmaster or that can't move
  items = items.filter((i) => !i.location.inPostmaster && !i.notransfer);
  items = addUpStackables(items);

  const itemsByType = _.mapValues(
    Object.groupBy(items, (i) => i.bucket.hash),
    (items) => limitToBucketSize(items, store),
  );

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems = Object.values(itemsByType)
    .flat()
    .map((i) => convertToLoadoutItem(i, false));

  return newLoadout(t('Loadouts.FilteredItems'), finalItems);
}

/**
 * Take a number of items from the list of items we mean to transfer to store,
 * such that no more items are selected than can fit into the destination
 * bucket, and the equipped item won't be changed.
 */
function limitToBucketSize(items: DimItem[], store: DimStore) {
  if (!items.length) {
    return [];
  }
  const item = items[0];
  const isVault = store.isVault;
  const bucket = isVault ? item.bucket.vaultBucket : item.bucket;

  if (!bucket) {
    return isVault ? items : _.take(items, 9);
  }

  const enum BucketLocation {
    AlreadyThereAndEquipped,
    AlreadyThereAndUnequipped,
    NotThere,
  }

  // Separate out any item that's already on the target store and further by equipped and not equipped -
  // this won't count against our space.
  const {
    [BucketLocation.AlreadyThereAndEquipped]: alreadyEquipped = [],
    [BucketLocation.AlreadyThereAndUnequipped]: alreadyUnequipped = [],
    [BucketLocation.NotThere]: otherItems = [],
  } = Object.groupBy(items, (item) =>
    item.owner === store.id
      ? item.equipped
        ? BucketLocation.AlreadyThereAndEquipped
        : BucketLocation.AlreadyThereAndUnequipped
      : BucketLocation.NotThere,
  );

  // TODO: this doesn't take into account stacks that need to split
  return _.take(
    // move the ones that are already there to the front to minimize moves
    [...alreadyEquipped, ...alreadyUnequipped, ...otherItems],
    // If a matching item is already equipped we can take 10, otherwise we have
    // to subtract one for the equipped item because we don't want to displace
    // it
    bucket.capacity - (item.equipment && !alreadyEquipped.length ? 1 : 0),
  );
}

// Add up stackable items so we don't have duplicates. This helps us actually move them, see
// https://github.com/DestinyItemManager/DIM/issues/2691#issuecomment-373970255
function addUpStackables(items: DimItem[]) {
  return Object.values(Object.groupBy(items, (t) => t.hash)).flatMap((items) => {
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
  BucketHashes.Vehicle,
  BucketHashes.Ships,
  BucketHashes.Emblems,
]);

/**
 * Create a random loadout from items across the whole inventory. Optionally filter items with the filter method.
 */
export function randomLoadout(store: DimStore, allItems: DimItem[], filter: ItemFilter) {
  // Do not allow random loadouts to pull cosmetics from other characters or the vault because it's obnoxious
  const onAcceptableRandomizeStore = (item: DimItem) =>
    item.bucket.sort !== 'General' || item.owner === store.id;

  // Any item equippable by this character in the given types
  const applicableItems = allItems.filter(
    (i) =>
      randomLoadoutTypes.has(i.bucket.hash) &&
      itemCanBeEquippedBy(i, store) &&
      onAcceptableRandomizeStore(i) &&
      filter(i),
  );

  // Use "random" as the value function
  return optimalLoadout(applicableItems, store, () => Math.random(), t('Loadouts.Random'));
}

export function randomSubclassConfiguration(
  defs: D2ManifestDefinitions,
  item: DimItem,
): SocketOverrides | undefined {
  if (!item.sockets) {
    return undefined;
  }

  const socketOverrides: SocketOverrides = {};
  // Pick abilities
  const abilityAndSuperSockets = getSocketsByCategoryHashes(
    item.sockets,
    subclassAbilitySocketCategoryHashes,
  );
  for (const socket of abilityAndSuperSockets) {
    // Stasis has no super plugSet
    if (socket.plugSet) {
      socketOverrides[socket.socketIndex] = _.sample(socket.plugSet.plugs)!.plugDef.hash;
    }
  }

  const randomizeSocketSeries = (sockets: DimSocket[], maxCount: number) => {
    if (sockets.length && maxCount > 0) {
      const blockedPlugs = [sockets[0].emptyPlugItemHash];
      for (const socket of sockets) {
        if (maxCount === 0) {
          break;
        }
        maxCount--;
        const chosenHash = _.sample(
          socket.plugSet!.plugs.filter((plug) => !blockedPlugs.includes(plug.plugDef.hash)),
        )!.plugDef.hash;
        if (chosenHash === undefined) {
          break;
        }
        socketOverrides[socket.socketIndex] = chosenHash;
        blockedPlugs.push(chosenHash);
      }
    }
  };

  // Pick aspects
  const aspectSockets = getSocketsByCategoryHashes(item.sockets, aspectSocketCategoryHashes);
  randomizeSocketSeries(aspectSockets, aspectSockets.length);

  // Pick as many fragments as allowed
  const resolved = {
    item,
    loadoutItem: { ...convertToLoadoutItem(item, false), socketOverrides },
  };
  const fragmentCount = getLoadoutSubclassFragmentCapacity(defs, resolved, true);

  const fragmentSockets = getSocketsByCategoryHashes(item.sockets, fragmentSocketCategoryHashes);
  randomizeSocketSeries(fragmentSockets, fragmentCount);

  return socketOverrides;
}
