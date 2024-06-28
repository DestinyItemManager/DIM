import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { BucketSortType } from 'app/inventory/inventory-buckets';
import { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { findItemsByBucket, getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { ArmorEnergyRules, LockableBucketHashes } from 'app/loadout-builder/types';
import { calculateAssumedItemEnergy } from 'app/loadout/armor-upgrade-utils';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { UNSET_PLUG_HASH } from 'app/loadout/known-values';
import {
  isInsertableArmor2Mod,
  mapToAvailableModCostVariant,
  sortMods,
} from 'app/loadout/mod-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { D1BucketHashes } from 'app/search/d1-known-values';
import {
  MASTERWORK_ARMOR_STAT_BONUS,
  MAX_ARMOR_ENERGY_CAPACITY,
  armorStats,
  deprecatedPlaceholderArmorModHash,
} from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import {
  isClassCompatible,
  isItemLoadoutCompatible,
  itemCanBeEquippedBy,
  itemCanBeInLoadout,
} from 'app/utils/item-utils';
import { weakMemoize } from 'app/utils/memoize';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  getFirstSocketByCategoryHash,
  getSocketsByCategoryHash,
  getSocketsByCategoryHashes,
  getSocketsByIndexes,
  plugFitsIntoSocket,
} from 'app/utils/socket-utils';
import { HashLookup, LookupTable } from 'app/utils/util-types';
import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyItemSubType,
  DestinyItemType,
  DestinyLoadoutItemComponent,
  DestinySeasonDefinition,
} from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { produce } from 'immer';
import _ from 'lodash';
import { D2Categories } from '../destiny2/d2-bucket-categories';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from '../inventory/item-types';
import {
  Loadout,
  LoadoutItem,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from '../loadout/loadout-types';

// We don't want to prepopulate the loadout with D1 cosmetics
export const fromEquippedTypes: (BucketHashes | D1BucketHashes)[] = [
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
  BucketHashes.Ships,
  BucketHashes.Vehicle,
  BucketHashes.Emblems,
];

// Bucket hashes, in order, that are contained within ingame loadouts
const inGameLoadoutBuckets: BucketHashes[] = [
  BucketHashes.Subclass,
  BucketHashes.KineticWeapons,
  BucketHashes.EnergyWeapons,
  BucketHashes.PowerWeapons,
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
];

/**
 * Buckets where the item should be treated as "singular" in a loadout - where
 * it can only have a single item and that item must be equipped.
 */
export const singularBucketHashes = [
  BucketHashes.Subclass,
  BucketHashes.Emblems,
  BucketHashes.Emotes_Invisible,
];

// order to display a list of all 8 gear slots
const gearSlotOrder: BucketHashes[] = [...D2Categories.Weapons, ...D2Categories.Armor];

/**
 * Creates a new loadout, with all of the items equipped and the items inserted mods saved.
 */
export function newLoadout(name: string, items: LoadoutItem[], classType?: DestinyClass): Loadout {
  return {
    id: globalThis.crypto.randomUUID(),
    classType:
      classType !== undefined && classType !== DestinyClass.Classified
        ? classType
        : DestinyClass.Unknown,
    name,
    items,
    clearSpace: false,
  };
}

/**
 * Create a socket overrides structure from the item's currently plugged sockets.
 * This will ignore all default plugs except for abilities where the default values
 * will be included.
 */
export function createSocketOverridesFromEquipped(item: DimItem) {
  if (item.sockets) {
    const socketOverrides: SocketOverrides = {};

    let fragmentCapacity = getSubclassFragmentCapacity(item);

    nextCategory: for (const category of item.sockets.categories) {
      const sockets = getSocketsByIndexes(item.sockets, category.socketIndexes);
      for (const socket of sockets) {
        // For subclass fragments, only active fragments should be saved.
        // This check has to happen early because a fragment is inactive if it's
        // in a fragment socket index >= capacity
        // (so with three fragment slots and fragments [1, 2, empty, 4] the last
        // fragment will be inactive)
        if (fragmentSocketCategoryHashes.includes(category.category.hash)) {
          if (fragmentCapacity > 0) {
            fragmentCapacity--;
          } else {
            continue nextCategory;
          }
        }

        // Add currently plugged, unless it's the empty option. Abilities and Supers
        // explicitly don't have an emptyPlugItemHash.
        if (
          socket.plugged &&
          // Only save them if they're valid plug options though, otherwise
          // we'd save the empty stasis sockets that Void 3.0 spawns with
          plugFitsIntoSocket(socket, socket.plugged.plugDef.hash) &&
          socket.plugged.plugDef.hash !== socket.emptyPlugItemHash
        ) {
          socketOverrides[socket.socketIndex] = socket.plugged.plugDef.hash;
        }
      }
    }
    return socketOverrides;
  }
}

/**
 * Create a new loadout that includes all the equipped items and mods on the character.
 */
export function newLoadoutFromEquipped(
  name: string,
  dimStore: DimStore,
  artifactUnlocks: LoadoutParameters['artifactUnlocks'],
) {
  const items = dimStore.items.filter(
    (item) =>
      item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.bucket.hash),
  );
  const loadoutItems = items.map((i) => {
    const item = convertToLoadoutItem(i, true);
    if (i.bucket.hash === BucketHashes.Subclass) {
      item.socketOverrides = createSocketOverridesFromEquipped(i);
    }
    return item;
  });
  const loadout = newLoadout(name, loadoutItems, dimStore.classType);
  // Choose a stable ID
  loadout.id = 'equipped';
  const mods = items.flatMap((i) => extractArmorModHashes(i));
  if (mods.length) {
    loadout.parameters = {
      mods,
    };
  }
  if (artifactUnlocks?.unlockedItemHashes.length) {
    loadout.parameters = {
      ...loadout.parameters,
      artifactUnlocks,
    };
  }
  // Save "fashion" mods for equipped items
  const modsByBucket: { [bucketHash: number]: number[] } = {};
  for (const item of items.filter((i) => i.bucket.inArmor)) {
    const plugs = item.sockets
      ? filterMap(
          getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics),
          (s) => s.plugged?.plugDef.hash,
        )
      : [];
    if (plugs.length) {
      modsByBucket[item.bucket.hash] = plugs;
    }
  }
  if (!_.isEmpty(modsByBucket)) {
    loadout.parameters = {
      ...loadout.parameters,
      modsByBucket,
    };
  }
  return loadout;
}

/**
 * Extract the equipped items into a list of ingame loadout item components. Basically newLoadoutFromEquipped
 * but for creating ingame loadout state.
 */
export function inGameLoadoutItemsFromEquipped(store: DimStore): DestinyLoadoutItemComponent[] {
  return inGameLoadoutBuckets.map((bucketHash) => {
    const item = findItemsByBucket(store, bucketHash).find((i) => i.equipped);
    const overrides = item && createSocketOverridesFromEquipped(item);
    return {
      itemInstanceId: item?.id ?? '0',
      // Ingame loadouts always specify plug hashes for 16 socket indexes
      plugItemHashes: Array.from(new Array(16), (_v, i) => overrides?.[i] ?? UNSET_PLUG_HASH),
    };
  });
}

/*
 * Calculates the light level for a list of items, one per type of weapon and armor
 * or it won't be accurate. function properly supports guardians w/o artifacts
 * returns to tenth decimal place.
 */
export function getLight(store: DimStore, items: DimItem[]): number {
  // https://www.reddit.com/r/DestinyTheGame/comments/6yg4tw/how_overall_power_level_is_calculated/
  if (store.destinyVersion === 2) {
    const exactLight = _.sumBy(items, (i) => i.power) / items.length;
    return Math.floor(exactLight * 1000) / 1000;
  } else {
    const itemWeight: LookupTable<BucketSortType, number> = {
      Weapons: 6,
      Armor: 5,
      General: 4,
    };

    const itemWeightDenominator = items.reduce(
      (memo, item) =>
        memo +
        (itemWeight[item.bucket.hash === BucketHashes.ClassArmor ? 'General' : item.bucket.sort!] ||
          0),
      0,
    );

    const exactLight =
      items.reduce(
        (memo, item) =>
          memo +
          item.power *
            (itemWeight[
              item.bucket.hash === BucketHashes.ClassArmor ? 'General' : item.bucket.sort!
            ] || 1),
        0,
      ) / itemWeightDenominator;

    return Math.floor(exactLight * 10) / 10;
  }
}

/**
 * This gets the loadout stats for all the equipped items and mods.
 *
 * It will add all stats from the mods whether they are equipped or not. If
 * you want to ensure it will be the same as the game stats, make sure to check
 * if all mods will fit on the items.
 */
export function getLoadoutStats(
  defs: D2ManifestDefinitions,
  classType: DestinyClass,
  subclass: ResolvedLoadoutItem | undefined,
  armor: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  includeRuntimeStatBenefits: boolean,
  /** Assume armor is masterworked according to these rules when calculating stats */
  armorEnergyRules?: ArmorEnergyRules,
) {
  const statDefs = armorStats.map((hash) => defs.Stat.get(hash));

  // Construct map of stat hash to DimCharacterStat
  const stats: { [hash: number | string]: DimCharacterStat } = {};
  for (const {
    hash,
    displayProperties: { description, icon, name },
  } of statDefs) {
    stats[hash] = { hash, description, icon: icon, name, value: 0, breakdown: [] };
  }

  // Sum the items stats into the stats
  const armorPiecesStats = _.mapValues(stats, () => 0);
  for (const item of armor) {
    const itemEnergy = armorEnergyRules && calculateAssumedItemEnergy(item, armorEnergyRules);
    const itemStats = Object.groupBy(item.stats ?? [], (stat) => stat.statHash);
    const energySocket =
      item.sockets && getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier);
    for (const hash of armorStats) {
      armorPiecesStats[hash] += itemStats[hash]?.[0].base ?? 0;
      armorPiecesStats[hash] +=
        itemEnergy === MAX_ARMOR_ENERGY_CAPACITY && item.energy
          ? MASTERWORK_ARMOR_STAT_BONUS
          : energySocket?.plugged?.stats?.[hash] ?? 0;
    }
  }

  for (const hash of armorStats) {
    stats[hash].value += armorPiecesStats[hash];
    stats[hash].breakdown!.push({
      hash: -1,
      count: undefined,
      name: t('Loadouts.ArmorStats'),
      icon: undefined,
      source: 'armorStats',
      value: armorPiecesStats[hash],
    });
  }

  const modStats = getTotalModStatChanges(
    defs,
    mods,
    subclass,
    classType,
    includeRuntimeStatBenefits,
  );

  for (const [statHash, value] of Object.entries(modStats)) {
    stats[statHash].value += value.value;
    if (value.breakdown) {
      stats[statHash].breakdown?.push(...value.breakdown);
    }
  }

  return stats;
}

// Generate an optimized item set (loadout items) based on a filtered set of items and a value function
export function optimalItemSet(
  applicableItems: DimItem[],
  store: DimStore,
  bestItemFn: (item: DimItem) => number,
): Record<'equippable' | 'equipUnrestricted' | 'classUnrestricted', DimItem[]> {
  const anyClassItemsByBucket = Object.groupBy(applicableItems, (i) => i.bucket.hash);
  const anyClassBestItemByBucket = _.mapValues(
    anyClassItemsByBucket,
    (thisSlotItems) => _.maxBy(thisSlotItems, bestItemFn)!,
  );
  const classUnrestricted = _.sortBy(Object.values(anyClassBestItemByBucket), (i) =>
    gearSlotOrder.indexOf(i.bucket.hash),
  );

  const thisClassItemsByBucket = Object.groupBy(
    applicableItems.filter((i) => itemCanBeEquippedBy(i, store, true)),
    (i) => i.bucket.hash,
  );
  const thisClassBestItemByBucket = _.mapValues(
    thisClassItemsByBucket,
    (thisSlotItems) => _.maxBy(thisSlotItems, bestItemFn)!,
  );
  const equipUnrestricted = _.sortBy(Object.values(thisClassBestItemByBucket), (i) =>
    gearSlotOrder.indexOf(i.bucket.hash),
  );

  let equippableBestItemByBucket = { ...thisClassBestItemByBucket };

  // Solve for the case where our optimizer decided to equip two exotics
  const getLabel = (i: DimItem) => i.equippingLabel;
  // All items that share an equipping label, grouped by label

  const overlaps = Map.groupBy(equipUnrestricted.filter(getLabel), (i) => getLabel(i)!);

  for (const overlappingItems of overlaps.values()) {
    if (overlappingItems.length <= 1) {
      continue;
    }

    const options: { [x: string]: DimItem }[] = [];
    // For each item, replace all the others overlapping it with the next best thing
    for (const item of overlappingItems) {
      const option = { ...equippableBestItemByBucket };
      const otherItems = overlappingItems.filter((i) => i !== item);
      let optionValid = true;

      for (const otherItem of otherItems) {
        // Note: we could look for items that just don't have the *same* equippingLabel but
        // that may fail if there are ever mutual-exclusion items beyond exotics.
        const nonExotics = thisClassItemsByBucket[otherItem.bucket.hash].filter(
          (i) => !i.equippingLabel,
        );
        if (nonExotics.length) {
          option[otherItem.bucket.hash] = _.maxBy(nonExotics, bestItemFn)!;
        } else {
          // this option isn't usable because we couldn't swap this exotic for any non-exotic
          optionValid = false;
        }
      }

      if (optionValid) {
        options.push(option);
      }
    }

    // Pick the option where the optimizer function adds up to the biggest number, again favoring equipped stuff
    if (options.length > 0) {
      const bestOption = _.maxBy(options, (opt) => _.sumBy(Object.values(opt), bestItemFn))!;
      equippableBestItemByBucket = bestOption;
    }
  }

  const equippable = _.sortBy(Object.values(equippableBestItemByBucket), (i) =>
    gearSlotOrder.indexOf(i.bucket.hash),
  );

  return { equippable, equipUnrestricted, classUnrestricted };
}

export function optimalLoadout(
  applicableItems: DimItem[],
  store: DimStore,
  bestItemFn: (item: DimItem) => number,
  name: string,
): Loadout {
  const { equippable } = optimalItemSet(applicableItems, store, bestItemFn);
  return newLoadout(
    name,
    equippable.map((i) => convertToLoadoutItem(i, true)),
  );
}
/**
 * Create a loadout from all of this character's items that can be in loadouts,
 * as a backup.
 */
export function backupLoadout(store: DimStore, name: string): Loadout {
  const allItems = store.items.filter(
    (item) => itemCanBeInLoadout(item) && !item.location.inPostmaster,
  );
  const loadout = newLoadout(
    name,
    allItems.map((i) => {
      const item = convertToLoadoutItem(i, i.equipped);
      if (i.bucket.hash === BucketHashes.Subclass) {
        item.socketOverrides = createSocketOverridesFromEquipped(i);
      }
      return item;
    }),
  );
  // Save mods too, so we put them back if you undo
  loadout.parameters = {
    mods: allItems.filter((i) => i.equipped).flatMap(extractArmorModHashes),
  };
  return loadout;
}

/**
 * Converts DimItem to a LoadoutItem.
 */
export function convertToLoadoutItem(item: DimItem, equip: boolean): LoadoutItem {
  return {
    id: item.id,
    hash: item.hash,
    amount: item.amount,
    equip,
    craftedDate: item.craftedInfo?.craftedDate,
  };
}

/** Extracts the equipped armour 2.0 mod hashes from the item */
export function extractArmorModHashes(item: DimItem) {
  if (!isLoadoutBuilderItem(item) || !item.sockets) {
    return [];
  }
  return filterMap(item.sockets.allSockets, (socket) =>
    socket.plugged && isInsertableArmor2Mod(socket.plugged.plugDef)
      ? socket.plugged.plugDef.hash
      : undefined,
  );
}

/**
 * Some items have been replaced with equivalent new items. So far that's been
 * true of the "Light 2.0" subclasses which are an entirely different item from
 * the old one. When loading loadouts we'd like to just use the new version.
 */
const oldToNewItems: HashLookup<number> = {
  // Arcstrider
  1334959255: 2328211300,
  // Striker
  2958378809: 2932390016,
  // Stormcaller
  1751782730: 3168997075,
  // Gunslinger
  3635991036: 2240888816,
  // Sunbreaker
  3105935002: 2550323932,
  // Dawnblade
  3481861797: 3941205951,
  // Nightstalker
  3225959819: 2453351420,
  // Sentinel
  3382391785: 2842471112,
  // Voidwalker
  3887892656: 2849050827,
};

/**
 * Items that are technically instanced but should always
 * be matched by hash.
 */
const matchByHash = [
  BucketHashes.Subclass,
  BucketHashes.Shaders,
  BucketHashes.Emblems,
  BucketHashes.Emotes_Invisible,
  BucketHashes.Emotes_Equippable,
  D1BucketHashes.Horn,
];

/**
 * Figure out how a LoadoutItem with a given hash should be resolved:
 * By hash or by id, and by which hash.
 */
export function getResolutionInfo(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadoutItemHash: number,
):
  | {
      hash: number;
      instanced: boolean;
      bucketHash: number;
    }
  | undefined {
  const hash = oldToNewItems[loadoutItemHash] ?? loadoutItemHash;

  const def = defs.InventoryItem.get(hash) as
    | undefined
    | (DestinyInventoryItemDefinition & {
        // D1 definitions use this toplevel "instanced" field
        instanced: boolean;
        bucketTypeHash: number;
      });
  // in this world, there are no guarantees
  if (!def) {
    return;
  }
  // Instanced items match by ID, uninstanced match by hash. It'd actually be
  // nice to use "is random rolled or configurable" here instead but that's hard
  // to determine.
  const bucketHash = def.bucketTypeHash || def.inventory?.bucketTypeHash || 0;
  const instanced = Boolean(
    (def.instanced || def.inventory?.isInstanceItem) &&
      // Subclasses and some other types are technically instanced but should be matched by hash
      !matchByHash.includes(bucketHash),
  );

  return {
    hash,
    instanced,
    bucketHash,
  };
}

/**
 * Returns the index of the LoadoutItem in the list of loadoutItems that would
 * resolve to the provided item, or -1 if not found. This is meant for finding
 * existing items that match some incoming item.
 */
export function findSameLoadoutItemIndex(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadoutItems: LoadoutItem[],
  item: DimItem,
) {
  const info = getResolutionInfo(defs, item.hash)!;

  return loadoutItems.findIndex((i) => {
    const newHash = oldToNewItems[i.hash] ?? i.hash;
    return (
      info.hash === newHash &&
      (!info.instanced ||
        item.id === i.id ||
        // Crafted items may change ID but keep their date
        (item.craftedInfo?.craftedDate && item.craftedInfo.craftedDate === i.craftedDate))
    );
  });
}

/**
 * Given a loadout item specification, find the corresponding inventory item we should use.
 */
export function findItemForLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  allItems: DimItem[],
  storeId: string | undefined,
  loadoutItem: LoadoutItem,
): DimItem | undefined {
  const info = getResolutionInfo(defs, loadoutItem.hash);

  if (!info) {
    return;
  }

  if (info.instanced) {
    return getInstancedLoadoutItem(allItems, loadoutItem);
  }

  return getUninstancedLoadoutItem(allItems, info.hash, storeId);
}

/**
 * Get a mapping from item id to item. Used for looking up items from loadouts.
 * This used to be restricted to only items that could be in loadouts, but we
 * need it to be all items to make search-based loadout transfers work.
 */
export const itemsByItemId = weakMemoize((allItems: DimItem[]) =>
  _.keyBy(
    allItems.filter((i) => i.id !== '0' && itemCanBeInLoadout(i)),
    (i) => i.id,
  ),
);

/**
 * Get a mapping from crafted date to item, for items that could be in loadouts. Used for
 * looking up items from loadouts.
 */
const itemsByCraftedDate = weakMemoize((allItems: DimItem[]) =>
  _.keyBy(
    allItems.filter((i) => i.instanced && i.craftedInfo?.craftedDate),
    (i) => i.craftedInfo!.craftedDate,
  ),
);

export function getInstancedLoadoutItem(allItems: DimItem[], loadoutItem: LoadoutItem) {
  const result = itemsByItemId(allItems)[loadoutItem.id];
  if (result) {
    return result;
  }

  // Crafted items get new IDs, but keep their crafted date, so we can match on that
  if (loadoutItem.craftedDate) {
    return itemsByCraftedDate(allItems)[loadoutItem.craftedDate];
  }
}

/**
 * Get a mapping from item hash to item. Used for looking up items from
 * loadouts. This used to be restricted to only items that could be in loadouts,
 * but we need it to be all items to make search-based loadout transfers work.
 */
const itemsByHash = weakMemoize((allItems: DimItem[]) => Map.groupBy(allItems, (i) => i.hash));

export function getUninstancedLoadoutItem(
  allItems: DimItem[],
  hash: number,
  storeId: string | undefined,
) {
  // This is for subclasses and emblems - it finds all matching items by hash and then picks the one that's on the desired character
  // It's also used for moving consumables in search loadouts
  const candidates = itemsByHash(allItems).get(hash) ?? [];
  // the copy of this item being held by the specified store
  const heldItem =
    storeId !== undefined ? candidates.find((item) => item.owner === storeId) : undefined;
  return heldItem ?? (candidates[0]?.notransfer ? undefined : candidates[0]);
}

/**
 * Given a loadout, see how many Fragments can be plugged
 *
 * If the loadout supplies Aspects, we use them to calculate Fragment capacity.
 *
 * When *applying* a Loadout subclass configuration with no Aspects, we make no Aspect changes.
 * Thus, `fallbackToCurrent` controls whether to use the subclass's current Aspect config.
 */
export function getLoadoutSubclassFragmentCapacity(
  defs: D2ManifestDefinitions,
  item: ResolvedLoadoutItem,
  fallbackToCurrent: boolean,
): number {
  if (item.item.sockets) {
    const aspectSocketIndices =
      item.item.sockets.categories.find((c) => aspectSocketCategoryHashes.includes(c.category.hash))
        ?.socketIndexes ?? [];
    const aspectDefs =
      item.loadoutItem.socketOverrides &&
      filterMap(aspectSocketIndices, (aspectSocketIndex) => {
        const aspectHash = item.loadoutItem.socketOverrides![aspectSocketIndex];
        return aspectHash ? defs.InventoryItem.get(aspectHash) : undefined;
      });
    if (aspectDefs?.length) {
      // the loadout provided some aspects. use those.
      return sumAspectCapacity(aspectDefs);
    } else if (fallbackToCurrent) {
      // the loadout provided no aspects. assume the currently applied aspects.
      return getSubclassFragmentCapacity(item.item);
    } else {
      return 0;
    }
  }
  return 0;
}

export function isMissingItems(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  allItems: DimItem[],
  storeId: string,
  loadout: Loadout,
): boolean {
  for (const loadoutItem of loadout.items) {
    const info = getResolutionInfo(defs, loadoutItem.hash);
    if (!info) {
      // If an item hash is entirely missing from the database, we show that
      // there is a missing item but can't offer a replacement (or even show
      // which item went missing), but we can maybe add a migration in `oldToNewItems`?
      return true;
    }
    if (info.instanced) {
      if (!getInstancedLoadoutItem(allItems, loadoutItem)) {
        return true;
      }
    } else if (storeId !== 'vault' && !getUninstancedLoadoutItem(allItems, info.hash, storeId)) {
      // The vault can't really have uninstanced items like subclasses or emblems, so no point
      // in reporting a missing item in that case.
      return true;
    }
  }
  return false;
}

export function isFashionOnly(defs: D2ManifestDefinitions, loadout: Loadout): boolean {
  if (loadout.items.length) {
    return false;
  }
  if (!loadout.parameters?.modsByBucket) {
    return false;
  }

  for (const bucketHash in loadout.parameters.modsByBucket) {
    // if this is mods for a non-armor bucket
    if (!LockableBucketHashes.includes(Number(bucketHash))) {
      return false;
    }
    const modsForThisArmorSlot = loadout.parameters.modsByBucket[bucketHash];
    if (
      modsForThisArmorSlot.some(
        (modHash) => !isFashionPlug(defs.InventoryItem.getOptional(modHash)),
      )
    ) {
      return false;
    }
  }

  return true;
}
/** not fashion mods, just useful ones */
export function isArmorModsOnly(defs: D2ManifestDefinitions, loadout: Loadout): boolean {
  // if it contains armor, it's not a mods-only loadout
  if (loadout.items.length) {
    return false;
  }
  // if there's no mods at all, this isn't a mods-only loadout
  if (!loadout.parameters?.mods?.length && !loadout.parameters?.modsByBucket) {
    return false;
  }
  // if there's specific mods, make sure none are fashion
  if (loadout.parameters?.modsByBucket) {
    for (const bucketHash in loadout.parameters.modsByBucket) {
      // if this is mods for a non-armor bucket
      if (!LockableBucketHashes.includes(Number(bucketHash))) {
        return false;
      }
      const modsForThisArmorSlot = loadout.parameters.modsByBucket[bucketHash];
      if (
        modsForThisArmorSlot.some((modHash) =>
          isFashionPlug(defs.InventoryItem.getOptional(modHash)),
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

/** given a hash we know is a plug, is this a fashion plug? */
export function isFashionPlug(modDef: DestinyInventoryItemDefinition | undefined): boolean {
  return Boolean(
    modDef &&
      (modDef.itemSubType === DestinyItemSubType.Shader ||
        modDef.itemSubType === DestinyItemSubType.Ornament ||
        modDef.itemType === DestinyItemType.Armor),
  );
}
/**
 * Returns a flat list of mods as PluggableInventoryItemDefinitions in the Loadout, by default including auto stat mods.
 * This INCLUDES both locked and unlocked mods; `unlockedPlugs` is used to identify if the expensive or cheap copy of an
 * armor mod should be used.
 */
export function getModsFromLoadout(
  defs: D2ManifestDefinitions | undefined,
  loadout: Loadout,
  unlockedPlugs = new Set<number>(),
) {
  const internalModHashes = loadout.parameters?.mods ?? [];

  return resolveLoadoutModHashes(defs, internalModHashes, unlockedPlugs);
}

const oldToNewMod: HashLookup<number> = {
  204137529: 1703647492, // InventoryItem "Minor Mobility Mod"
  3961599962: 4183296050, // InventoryItem "Mobility Mod"
  3682186345: 2532323436, // InventoryItem "Minor Resilience Mod"
  2850583378: 1180408010, // InventoryItem "Resilience Mod"
  555005975: 1237786518, // InventoryItem "Minor Recovery Mod"
  2645858828: 4204488676, // InventoryItem "Recovery Mod"
  2623485440: 4021790309, // InventoryItem "Minor Discipline Mod"
  4048838440: 1435557120, // InventoryItem "Discipline Mod"
  1227870362: 350061697, // InventoryItem "Minor Intellect Mod"
  3355995799: 2724608735, // InventoryItem "Intellect Mod"
  3699676109: 2639422088, // InventoryItem "Minor Strength Mod"
  3253038666: 4287799666, // InventoryItem "Strength Mod"
};

export function hasDeprecatedMods(loadout: Loadout, defs: D2ManifestDefinitions): boolean {
  return Boolean(
    loadout.parameters?.mods?.some((modHash) => {
      const migratedModHash = oldToNewMod[modHash] ?? modHash;
      return (
        deprecatedMods.includes(migratedModHash) || !defs.InventoryItem.getOptional(migratedModHash)
      );
    }),
  );
}

/**
 * Convert a list of plug item hashes into ResolvedLoadoutMods, which may not be
 * the same as the original hashes as we try to be smart about what the user meant.
 * e.g. we replace some mods with lower-cost variants depending on the artifact state.
 * @param unlockedPlugs all unlocked mod hashes. See unlockedPlugSetItemsSelector.
 */
export function resolveLoadoutModHashes(
  defs: D2ManifestDefinitions | undefined,
  modHashes: number[] | undefined,
  unlockedPlugs: Set<number>,
) {
  const mods: ResolvedLoadoutMod[] = [];
  if (defs && modHashes) {
    for (const originalModHash of modHashes) {
      const migratedModHash = oldToNewMod[originalModHash] ?? originalModHash;
      const resolvedModHash = mapToAvailableModCostVariant(migratedModHash, unlockedPlugs);
      const item = defs.InventoryItem.getOptional(resolvedModHash);
      if (isPluggableItem(item)) {
        mods.push({ originalModHash, resolvedMod: item });
      } else {
        const deprecatedPlaceholderMod = defs.InventoryItem.get(deprecatedPlaceholderArmorModHash);
        isPluggableItem(deprecatedPlaceholderMod) &&
          mods.push({ originalModHash, resolvedMod: deprecatedPlaceholderMod });
      }
    }
  }

  return mods.sort((a, b) => sortMods(a.resolvedMod, b.resolvedMod));
}

/**
 * given a real (or overridden) subclass item,
 * determine how many Fragment slots are provided by its current Aspects
 */
function getSubclassFragmentCapacity(subclassItem: DimItem): number {
  const aspects = getSocketsByCategoryHashes(subclassItem.sockets, aspectSocketCategoryHashes);
  return sumAspectCapacity(aspects.map((a) => a.plugged?.plugDef));
}

/** given some Aspects or Aspect sockets, see how many Fragment slots they'll provide */
function sumAspectCapacity(
  aspects: (DestinyInventoryItemDefinition | DimSocket | undefined)[] | undefined,
) {
  return _.sumBy(aspects, (aspect) => {
    const aspectDef = aspect && 'plugged' in aspect ? aspect.plugged?.plugDef : aspect;
    return aspectDef?.plug?.energyCapacity?.capacityValue || 0;
  });
}

/**
 * filter for items that are in a character's "pockets" but not equipped,
 * and can be added to a loadout
 */
export function getUnequippedItemsForLoadout(dimStore: DimStore, category?: string) {
  return dimStore.items.filter(
    (item) =>
      !item.equipped &&
      !item.location.inPostmaster &&
      !singularBucketHashes.includes(item.bucket.hash) &&
      itemCanBeInLoadout(item) &&
      isClassCompatible(item.classType, dimStore.classType) &&
      (category ? item.bucket.sort === category : fromEquippedTypes.includes(item.bucket.hash)),
  );
}

/**
 * Pick a (non-vault) store that backs the loadout drawer, using the
 * preferredStoreId if it matches the classType and using the first
 * matching store otherwise.
 */
export function pickBackingStore(
  stores: DimStore[],
  preferredStoreId: string | undefined,
  classType: DestinyClass,
) {
  classType = classType === DestinyClass.Classified ? DestinyClass.Unknown : classType;
  const requestedStore =
    !preferredStoreId || preferredStoreId === 'vault'
      ? getCurrentStore(stores)
      : getStore(stores, preferredStoreId);
  return requestedStore && isClassCompatible(classType, requestedStore.classType)
    ? requestedStore
    : stores.find((s) => !s.isVault && isClassCompatible(classType, s.classType));
}

/**
 * Remove items and settings that don't match the loadout's class type.
 */
export function filterLoadoutToAllowedItems(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  loadoutToSave: Readonly<Loadout>,
): Readonly<Loadout> {
  return produce(loadoutToSave, (loadout) => {
    // Filter out items that don't fit the class type
    loadout.items = loadout.items.filter((loadoutItem) => {
      const classType = defs.InventoryItem.get(loadoutItem.hash)?.classType;
      return classType !== undefined && isItemLoadoutCompatible(classType, loadout.classType);
    });

    if (loadout.classType === DestinyClass.Unknown && loadout.parameters) {
      // Remove fashion and non-mod loadout parameters from Any Class loadouts
      // FIXME It's really easy to forget to consider properties of LoadoutParameters here,
      // maybe some type voodoo can force us to make a decision for every property?
      if (
        loadout.parameters.mods?.length ||
        loadout.parameters.clearMods ||
        loadout.parameters.artifactUnlocks ||
        // weapons but not armor since AnyClass loadouts can't have armor
        loadout.parameters.clearWeapons
      ) {
        loadout.parameters = {
          mods: loadout.parameters.mods,
          clearMods: loadout.parameters.clearMods,
          artifactUnlocks: loadout.parameters.artifactUnlocks,
          clearWeapons: loadout.parameters.clearWeapons,
        };
      } else {
        delete loadout.parameters;
      }
    }
  });
}

export function getLoadoutSeason(loadout: Loadout, seasons: DestinySeasonDefinition[]) {
  return seasons.find(
    (s) => new Date(s.startDate!).getTime() <= (loadout.lastUpdatedAt ?? Date.now()),
  );
}
