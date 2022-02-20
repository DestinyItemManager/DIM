import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isModStatActive } from 'app/loadout-builder/process/mappers';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { isInsertableArmor2Mod, sortMods } from 'app/loadout/mod-utils';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { armorStats } from 'app/search/d2-known-values';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import {
  getFirstSocketByCategoryHash,
  getSocketsByCategoryHash,
  getSocketsByIndexes,
} from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { D2Categories } from '../destiny2/d2-bucket-categories';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { Loadout, LoadoutItem } from './loadout-types';

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

// TODO (ryan) why is this a thing? Weapons doesn't contain either of these
const excludeGearSlots = ['Class', 'SeasonalArtifacts'];
// order to display a list of all 8 gear slots
const gearSlotOrder: DimItem['type'][] = [
  ...D2Categories.Weapons.filter((t) => !excludeGearSlots.includes(t)),
  ...D2Categories.Armor,
];

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
    for (const category of item.sockets.categories) {
      const sockets = getSocketsByIndexes(item.sockets, category.socketIndexes);
      for (const socket of sockets) {
        // Add currently plugged, if it is an ability we include the initial item
        // otherwise we ignore them, this stops us showing/saving empty socket plugs
        if (
          socket.plugged &&
          (socket.plugged.plugDef.hash !== socket.socketDefinition.singleInitialItemHash ||
            category.category.hash === SocketCategoryHashes.Abilities ||
            category.category.hash === SocketCategoryHashes.Super)
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
  subclass: LoadoutItem | undefined,
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
  if (subclass?.socketOverrides) {
    for (const plugHash of Object.values(subclass.socketOverrides)) {
      const plug = defs.InventoryItem.get(plugHash);
      for (const stat of plug.investmentStats) {
        if (stat.statTypeHash in stats) {
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
  const unrestricted = _.sortBy(Object.values(items), (i) => gearSlotOrder.indexOf(i.type));

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

  const equippable = _.sortBy(Object.values(items), (i) => gearSlotOrder.indexOf(i.type));

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
 * Converts DimItem or other LoadoutItem-like objects to real loadout items.
 */
export function convertToLoadoutItem(item: LoadoutItem, equipped: boolean) {
  return {
    id: item.id,
    hash: item.hash,
    amount: item.amount,
    socketOverrides: item.socketOverrides,
    equipped,
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

export function findItem(allItems: DimItem[], loadoutItem: LoadoutItem): DimItem | undefined {
  // TODO: so inefficient to look through all items over and over again
  // TODO: figure out which items *should* be instanced and which shouldn't so we can omit item IDs in shared loadouts\
  // TODO: maybe some things like subclasses, emblems, ships, etc can just match by hash. Anything that's not random rolled actually!
  for (const item of allItems) {
    if (
      (loadoutItem.id && loadoutItem.id !== '0' && loadoutItem.id === item.id) ||
      ((!loadoutItem.id || loadoutItem.id === '0') && loadoutItem.hash === item.hash)
    ) {
      return item;
    }
  }
  return undefined;
}

export function isMissingItems(allItems: DimItem[], loadout: Loadout): boolean {
  for (const loadoutItem of loadout.items) {
    const item = findItem(allItems, loadoutItem);
    if (!item) {
      return true;
    }
  }
  return false;
}

/** Returns a set of PluggableInventoryItemDefinition's grouped by plugCategoryHash. */
export function getModsFromLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions | undefined,
  loadout: Loadout
) {
  const mods: PluggableInventoryItemDefinition[] = [];

  if (defs?.isDestiny2() && loadout.parameters?.mods) {
    for (const modHash of loadout.parameters.mods) {
      const item = defs.InventoryItem.get(modHash);

      if (isPluggableItem(item)) {
        mods.push(item);
      }
    }
  }

  return mods.sort(sortMods);
}
