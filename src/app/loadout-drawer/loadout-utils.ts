import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { isModStatActive } from 'app/loadout-builder/process/mappers';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { isInsertableArmor2Mod, sortMods } from 'app/loadout/mod-utils';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { armorStats } from 'app/search/d2-known-values';
import { isPlugStatActive, itemCanBeInLoadout } from 'app/utils/item-utils';
import {
  getDefaultAbilityChoiceHash,
  getFirstSocketByCategoryHash,
  getSocketsByCategoryHash,
  getSocketsByCategoryHashes,
  getSocketsByIndexes,
  plugFitsIntoSocket,
} from 'app/utils/socket-utils';
import { DestinyClass, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { D2Categories } from '../destiny2/d2-bucket-categories';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from './loadout-types';

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
    id: uuidv4(),
    classType: classType ?? DestinyClass.Unknown,
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
        if (category.category.hash === SocketCategoryHashes.Fragments) {
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
 * Create the socket overrides that this subclass should start with for loadout purposes.
 */
export function createSubclassDefaultSocketOverrides(item: DimItem) {
  if (item.bucket.hash === BucketHashes.Subclass && item.sockets) {
    const socketOverrides: SocketOverrides = {};
    const abilityAndSuperSockets = getSocketsByCategoryHashes(item.sockets, [
      SocketCategoryHashes.Abilities_Abilities,
      SocketCategoryHashes.Abilities_Abilities_LightSubclass,
      SocketCategoryHashes.Super,
    ]);

    for (const socket of abilityAndSuperSockets) {
      socketOverrides[socket.socketIndex] =
        socket.plugged &&
        socket.plugSet?.plugs.some((plug) => plug.plugDef.hash === socket.plugged!.plugDef.hash)
          ? socket.plugged.plugDef.hash
          : getDefaultAbilityChoiceHash(socket);
    }
    return socketOverrides;
  }
}

/**
 * Create a new loadout that includes all the equipped items and mods on the character.
 */
export function newLoadoutFromEquipped(name: string, dimStore: DimStore) {
  const items = dimStore.items.filter(
    (item) =>
      item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.bucket.hash)
  );
  const loadoutItems = items.map((i) => {
    const item = convertToLoadoutItem(i, true);
    if (i.bucket.hash === BucketHashes.Subclass) {
      item.socketOverrides = createSocketOverridesFromEquipped(i);
    }
    return item;
  });
  const loadout = newLoadout(name, loadoutItems, dimStore.classType);
  const mods = items.flatMap((i) => extractArmorModHashes(i));
  if (mods.length) {
    loadout.parameters = {
      mods,
    };
  }
  // Save "fashion" mods for equipped items
  const modsByBucket = {};
  for (const item of items.filter((i) => i.bucket.inArmor)) {
    const plugs = item.sockets
      ? _.compact(
          getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics).map(
            (s) => s.plugged?.plugDef.hash
          )
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
    const itemWeight = {
      Weapons: 6,
      Armor: 5,
      General: 4,
    };

    const itemWeightDenominator = items.reduce(
      (memo, item) =>
        memo +
        (itemWeight[item.bucket.hash === BucketHashes.ClassArmor ? 'General' : item.bucket.sort!] ||
          0),
      0
    );

    const exactLight =
      items.reduce(
        (memo, item) =>
          memo +
          item.power *
            (itemWeight[
              item.bucket.hash === BucketHashes.ClassArmor ? 'General' : item.bucket.sort!
            ] || 1),
        0
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
  mods: PluggableInventoryItemDefinition[]
) {
  const statDefs = armorStats.map((hash) => defs.Stat.get(hash));

  // Construct map of stat hash to DimCharacterStat
  const stats: { [hash: number]: DimCharacterStat } = {};
  statDefs.forEach(({ hash, displayProperties: { description, icon, name } }) => {
    stats[hash] = { hash, description, icon: bungieNetPath(icon), name, value: 0 };
  });

  // Sum the items stats into the stats
  armor.forEach((item) => {
    const itemStats = _.groupBy(item.stats, (stat) => stat.statHash);
    const energySocket =
      item.sockets && getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier);
    Object.entries(stats).forEach(([hash, stat]) => {
      stat.value += itemStats[hash]?.[0].base ?? 0;
      stat.value += energySocket?.plugged?.stats?.[hash] || 0;
    });
  });

  // Add stats that come from the subclass fragments
  // TODO: Now that we apply socket overrides when we resolve items, do we need to do this calculation?
  if (subclass?.loadoutItem.socketOverrides) {
    for (const plugHash of Object.values(subclass.loadoutItem.socketOverrides)) {
      const plug = defs.InventoryItem.get(plugHash);
      for (const stat of plug.investmentStats) {
        if (
          stat.statTypeHash in stats &&
          isPlugStatActive(subclass.item, plug, stat.statTypeHash, stat.isConditionallyActive)
        ) {
          stats[stat.statTypeHash].value += stat.value;
        }
      }
    }
  }

  // Add the mod stats
  for (const mod of mods) {
    for (const stat of mod.investmentStats) {
      if (stat.statTypeHash in stats && isModStatActive(classType, mod.hash, stat, mods)) {
        stats[stat.statTypeHash].value += stat.value;
      }
    }
  }

  return stats;
}

// Generate an optimized item set (loadout items) based on a filtered set of items and a value function
export function optimalItemSet(
  applicableItems: DimItem[],
  bestItemFn: (item: DimItem) => number
): Record<'equippable' | 'unrestricted', DimItem[]> {
  const itemsByType = _.groupBy(applicableItems, (i) => i.bucket.hash);

  // Pick the best item
  let items = _.mapValues(itemsByType, (items) => _.maxBy(items, bestItemFn)!);
  const unrestricted = _.sortBy(Object.values(items), (i) => gearSlotOrder.indexOf(i.bucket.hash));

  // Solve for the case where our optimizer decided to equip two exotics
  const getLabel = (i: DimItem) => i.equippingLabel;
  // All items that share an equipping label, grouped by label
  const overlaps = _.groupBy(unrestricted.filter(getLabel), getLabel);
  _.forIn(overlaps, (overlappingItems) => {
    if (overlappingItems.length <= 1) {
      return;
    }

    const options: { [x: string]: DimItem }[] = [];
    // For each item, replace all the others overlapping it with the next best thing
    for (const item of overlappingItems) {
      const option = { ...items };
      const otherItems = overlappingItems.filter((i) => i !== item);
      let optionValid = true;

      for (const otherItem of otherItems) {
        // Note: we could look for items that just don't have the *same* equippingLabel but
        // that may fail if there are ever mutual-exclusion items beyond exotics.
        const nonExotics = itemsByType[otherItem.bucket.hash].filter((i) => !i.equippingLabel);
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
      items = bestOption;
    }
  });

  const equippable = _.sortBy(Object.values(items), (i) => gearSlotOrder.indexOf(i.bucket.hash));

  return { equippable, unrestricted };
}

export function optimalLoadout(
  applicableItems: DimItem[],
  bestItemFn: (item: DimItem) => number,
  name: string
): Loadout {
  const { equippable } = optimalItemSet(applicableItems, bestItemFn);
  return newLoadout(
    name,
    equippable.map((i) => convertToLoadoutItem(i, true))
  );
}
/**
 * Create a loadout from all of this character's items that can be in loadouts,
 * as a backup.
 */
export function backupLoadout(store: DimStore, name: string): Loadout {
  const allItems = store.items.filter(
    (item) => itemCanBeInLoadout(item) && !item.location.inPostmaster
  );
  const loadout = newLoadout(
    name,
    allItems.map((i) => {
      const item = convertToLoadoutItem(i, i.equipped);
      if (i.bucket.hash === BucketHashes.Subclass) {
        item.socketOverrides = createSocketOverridesFromEquipped(i);
      }
      return item;
    })
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
export function convertToLoadoutItem(
  item: DimItem,
  equip: boolean,
  amount = item.amount
): LoadoutItem {
  return {
    id: item.id,
    hash: item.hash,
    amount,
    equip,
    craftedDate: item.craftedInfo?.craftedDate,
  };
}

/** Extracts the equipped armour 2.0 mod hashes from the item */
export function extractArmorModHashes(item: DimItem) {
  if (!isLoadoutBuilderItem(item) || !item.sockets) {
    return [];
  }
  return _.compact(
    item.sockets.allSockets.map(
      (socket) =>
        socket.plugged &&
        isInsertableArmor2Mod(socket.plugged.plugDef) &&
        socket.plugged.plugDef.hash
    )
  );
}

/**
 * Some items have been replaced with equivalent new items. So far that's been
 * true of the "Light 2.0" subclasses which are an entirely different item from
 * the old one. When loading loadouts we'd like to just use the new version.
 */
const oldToNewItems = {
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
  loadoutItemHash: number
) {
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
  const instanced =
    (def.instanced || def.inventory?.isInstanceItem) &&
    // Subclasses and some other types are technically instanced but should be matched by hash
    !matchByHash.includes(bucketHash);

  return {
    hash,
    instanced,
  };
}

/**
 * Returns the index of the LoadoutItem in the list of loadoutItems that would
 * resolve to the same item as loadoutItem, or -1 if not found.
 */
export function findSameLoadoutItemIndex(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadoutItems: LoadoutItem[],
  loadoutItem: Pick<LoadoutItem, 'hash' | 'id'>
) {
  const info = getResolutionInfo(defs, loadoutItem.hash)!;

  return loadoutItems.findIndex((i) => {
    const newHash = oldToNewItems[i.hash] ?? i.hash;
    return info.hash === newHash && (!info.instanced || loadoutItem.id === i.id);
  });
}

/**
 * Given a loadout item specification, find the corresponding inventory item we should use.
 */
export function findItemForLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  allItems: DimItem[],
  storeId: string | undefined,
  loadoutItem: LoadoutItem
): DimItem | undefined {
  const info = getResolutionInfo(defs, loadoutItem.hash);

  if (!info) {
    return;
  }

  // TODO: so inefficient to look through all items over and over again - need an index by ID and hash
  if (info.instanced) {
    return allItems.find((item) => item.id === loadoutItem.id);
  }

  return getUninstancedLoadoutItem(allItems, info.hash, storeId);
}

export function getUninstancedLoadoutItem(
  allItems: DimItem[],
  hash: number,
  storeId: string | undefined
) {
  // This is mostly for subclasses - it finds all matching items by hash and then picks the one that's on the desired character
  const candidates = allItems.filter((item) => item.hash === hash);
  const onCurrent =
    storeId !== undefined ? candidates.find((item) => item.owner === storeId) : undefined;
  return onCurrent ?? (candidates[0]?.notransfer ? undefined : candidates[0]);
}

export function isMissingItems(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  allItems: DimItem[],
  storeId: string,
  loadout: Loadout
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
      if (!allItems.some((item) => item.id === loadoutItem.id)) {
        return true;
      }
    } else {
      // The vault can't really have uninstanced items like subclasses or emblems, so no point
      // in reporting a missing item in that case.
      if (storeId !== 'vault' && !getUninstancedLoadoutItem(allItems, info.hash, storeId)) {
        return true;
      }
    }
  }
  return false;
}

/** Returns a flat list of mods hashes in the Loadout, by default including auto stat mods */
export function getModHashesFromLoadout(loadout: Loadout, includeAutoMods = true) {
  return [
    ...(loadout.parameters?.mods ?? []),
    ...((includeAutoMods && loadout.autoStatMods) || []),
  ];
}

/** Returns a flat list of mods as PluggableInventoryItemDefinitions in the Loadout, by default including auto stat mods */
export function getModsFromLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions | undefined,
  loadout: Loadout,
  includeAutoMods = true
) {
  const mods: PluggableInventoryItemDefinition[] = [];

  if (defs?.isDestiny2()) {
    for (const modHash of getModHashesFromLoadout(loadout, includeAutoMods)) {
      const item = defs.InventoryItem.get(modHash);

      if (isPluggableItem(item)) {
        mods.push(item);
      }
    }
  }

  return mods.sort(sortMods);
}

export function getSubclassFragmentCapacity(subclassItem: DimItem): number {
  const aspects = getSocketsByCategoryHash(subclassItem.sockets, SocketCategoryHashes.Aspects);
  return _.sumBy(
    aspects,
    (aspect) => aspect.plugged?.plugDef.plug.energyCapacity?.capacityValue || 0
  );
}

/**
 * filter for items that are in a character's "pockets" but not equipped,
 * and can be added to a loadout
 */
export function getUnequippedItemsForLoadout(dimStore: DimStore, category?: string) {
  return dimStore.items.filter(
    (item) =>
      !item.location.inPostmaster &&
      !singularBucketHashes.includes(item.bucket.hash) &&
      itemCanBeInLoadout(item) &&
      (category ? item.bucket.sort === category : fromEquippedTypes.includes(item.bucket.hash)) &&
      !item.equipped
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
  classType: DestinyClass
) {
  const requestedStore =
    !preferredStoreId || preferredStoreId === 'vault'
      ? getCurrentStore(stores)
      : getStore(stores, preferredStoreId);
  return requestedStore &&
    (classType === DestinyClass.Unknown || requestedStore.classType === classType)
    ? requestedStore
    : stores.find(
        (s) => !s.isVault && (s.classType === classType || classType === DestinyClass.Unknown)
      );
}
