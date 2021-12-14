import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimBucketType } from 'app/inventory/inventory-buckets';
import { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isModStatActive } from 'app/loadout-builder/process/mappers';
import { isLoadoutBuilderItem } from 'app/loadout/item-utils';
import { isInsertableArmor2Mod, sortMods } from 'app/loadout/mod-utils';
import { armorStats } from 'app/search/d2-known-values';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { D2Categories } from '../destiny2/d2-bucket-categories';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { DimLoadoutItem, Loadout, LoadoutItem } from './loadout-types';

// We don't want to prepopulate the loadout with D1 cosmetics
export const fromEquippedTypes: DimBucketType[] = [
  'Class',
  'KineticSlot',
  'Energy',
  'Power',
  'Primary',
  'Special',
  'Heavy',
  'Helmet',
  'Gauntlets',
  'Chest',
  'Leg',
  'ClassItem',
  'Artifact',
  'Ghost',
  'Ships',
  'Vehicle',
  'Emblems',
];

const excludeGearSlots = ['Class', 'SeasonalArtifacts'];
// order to display a list of all 8 gear slots
const gearSlotOrder: DimItem['type'][] = [
  ...D2Categories.Weapons.filter((t) => !excludeGearSlots.includes(t)),
  ...D2Categories.Armor,
];

/**
 * Creates a new loadout, with all of the items equipped and the items inserted mods saved.
 */
export function newLoadout(name: string, items: LoadoutItem[]): Loadout {
  return {
    id: uuidv4(),
    classType: DestinyClass.Unknown,
    name,
    items,
    clearSpace: false,
  };
}

/**
 * Create a socket overrides structure from the item's currently plugged sockets.
 */
function createSocketOverridesFromEquipped(item: DimItem) {
  const socketOverrides: SocketOverrides = {};
  for (const socket of item.sockets?.allSockets || []) {
    // If the socket is plugged and we plug isn't the initial plug we apply the overrides
    // to the loadout.
    if (
      socket.plugged &&
      socket.plugged.plugDef.hash !== socket.socketDefinition.singleInitialItemHash
    ) {
      socketOverrides[socket.socketIndex] = socket.plugged.plugDef.hash;
    }
  }
  return socketOverrides;
}

/**
 * Create a new loadout that includes all the equipped items and mods on the character.
 */
export function newLoadoutFromEquipped(name: string, dimStore: DimStore) {
  const items = dimStore.items.filter(
    (item) => item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.type)
  );
  const loadout = newLoadout(
    name,
    items.map((i) => {
      const item = convertToLoadoutItem(i, true);
      if (i.bucket.hash === BucketHashes.Subclass) {
        item.socketOverrides = createSocketOverridesFromEquipped(i);
      }
      return item;
    })
  );
  const mods = items.flatMap((i) => extractArmorModHashes(i));
  if (mods.length) {
    loadout.parameters = {
      mods,
    };
  }
  loadout.classType = dimStore.classType;
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
        memo + (itemWeight[item.type === 'ClassItem' ? 'General' : item.bucket.sort!] || 0),
      0
    );

    const exactLight =
      items.reduce(
        (memo, item) =>
          memo +
          item.power * (itemWeight[item.type === 'ClassItem' ? 'General' : item.bucket.sort!] || 1),
        0
      ) / itemWeightDenominator;

    return Math.floor(exactLight * 10) / 10;
  }
}

/** Returns a map of armor stat hashes to stats. There should be just one of each item */
export function getArmorStats(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  items: DimItem[]
): { [hash: number]: DimCharacterStat } {
  const statDefs = armorStats.map((hash) => defs.Stat.get(hash) as DestinyStatDefinition);

  // Construct map of stat hash to DimCharacterStat
  const statsByArmorHash: { [hash: number]: DimCharacterStat } = {};
  statDefs.forEach(({ hash, displayProperties: { description, icon, name } }) => {
    statsByArmorHash[hash] = { hash, description, icon: bungieNetPath(icon), name, value: 0 };
  });

  // Sum the items stats into the statsByArmorHash
  items.forEach((item) => {
    const itemStats = _.groupBy(item.stats, (stat) => stat.statHash);
    Object.entries(statsByArmorHash).forEach(([hash, stat]) => {
      stat.value += itemStats[hash]?.[0].value ?? 0;
    });
  });

  return statsByArmorHash;
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
  const itemsByType = _.groupBy(applicableItems, (i) => i.type);

  // Pick the best item
  let items = _.mapValues(itemsByType, (items) => _.maxBy(items, bestItemFn)!);
  const unrestricted = _.sortBy(Object.values(items), (i) => gearSlotOrder.indexOf(i.type));

  // Solve for the case where our optimizer decided to equip two exotics
  const getLabel = (i: DimItem) => i.equippingLabel;
  // All items that share an equipping label, grouped by label
  const overlaps = _.groupBy(Object.values(items).filter(getLabel), getLabel);
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
        const nonExotics = itemsByType[otherItem.type].filter((i) => !i.equippingLabel);
        if (nonExotics.length) {
          option[otherItem.type] = _.maxBy(nonExotics, bestItemFn)!;
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

function findItem(allItems: DimItem[], loadoutItem: LoadoutItem): DimItem | undefined {
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

/**
 * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
 * are returned as warnitems.
 */
export function getItemsFromLoadoutItems(
  loadoutItems: LoadoutItem[] | undefined,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  allItems: DimItem[]
): [DimLoadoutItem[], DimItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const items: DimLoadoutItem[] = [];
  const warnitems: DimItem[] = [];
  for (const loadoutItem of loadoutItems) {
    const item = findItem(allItems, loadoutItem);
    if (item) {
      items.push({ ...item, ...loadoutItem });
    } else {
      const itemDef = defs.InventoryItem.get(loadoutItem.hash);
      if (itemDef) {
        // TODO: makeFakeItem
        warnitems.push({
          ...loadoutItem,
          icon: itemDef.displayProperties?.icon || itemDef.icon,
          name: itemDef.displayProperties?.name || itemDef.itemName,
        } as DimItem);
      }
    }
  }

  return [items, warnitems];
}

/**
 * Returns a Loadout object containing currently equipped items
 * @deprecated
 */
export function loadoutFromEquipped(store: DimStore): Loadout {
  const items = store.items.filter((item) => item.equipped && itemCanBeInLoadout(item));

  const loadout = newLoadout(
    t('Loadouts.CurrentlyEquipped'),
    items.map((i) => convertToLoadoutItem(i, true))
  );
  loadout.classType = store.classType;

  return loadout;
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
