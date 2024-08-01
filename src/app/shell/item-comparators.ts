import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { D2ItemTiers } from 'app/search/d2-known-values';
import { ItemSortSettings } from 'app/settings/item-sort';
import { isD1Item } from 'app/utils/item-utils';
import { DestinyAmmunitionType, DestinyDamageTypeDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { TagValue, tagConfig, vaultGroupTagOrder } from '../inventory/dim-item-info';
import { Comparator, chainComparator, compareBy, reverseComparator } from '../utils/comparators';

const INSTANCEID_PADDING = 20;

export const getItemRecencyKey = (item: DimItem) =>
  item.instanced ? item.id.padStart(INSTANCEID_PADDING, '0') : 0;

/**
 * Sorts items by how recently they were acquired, newest items first.
 */
export const acquisitionRecencyComparator = reverseComparator(compareBy(getItemRecencyKey));

export const isNewerThan = (item: DimItem, watermarkInstanceId: string) =>
  getItemRecencyKey(item) > watermarkInstanceId.padStart(INSTANCEID_PADDING, '0');

const D1_CONSUMABLE_SORT_ORDER = [
  1043138475, // black-wax-idol
  1772853454, // blue-polyphage
  3783295803, // ether-seeds
  3446457162, // resupply-codes
  269776572, // house-banners
  3632619276, // silken-codex
  2904517731, // axiomatic-beads
  1932910919, // network-keys
  //
  417308266, // three of coins
  //
  2180254632, // ammo-synth
  928169143, // special-ammo-synth
  211861343, // heavy-ammo-synth
  //
  705234570, // primary telemetry
  3371478409, // special telemetry
  2929837733, // heavy telemetry
  4159731660, // auto rifle telemetry
  846470091, // hand cannon telemetry
  2610276738, // pulse telemetry
  323927027, // scout telemetry
  729893597, // fusion rifle telemetry
  4141501356, // shotgun telemetry
  927802664, // sniper rifle telemetry
  1485751393, // machine gun telemetry
  3036931873, // rocket launcher telemetry
  //
  2220921114, // vanguard rep boost
  1500229041, // crucible rep boost
  1603376703, // HoJ rep boost
  //
  2575095887, // Splicer Intel Relay
  3815757277, // Splicer Cache Key
  4244618453, // Splicer Key
];

const D1_MATERIAL_SORT_ORDER = [
  1797491610, // Helium
  3242866270, // Relic Iron
  2882093969, // Spin Metal
  2254123540, // Spirit Bloom
  3164836592, // Wormspore
  3164836593, // Hadium Flakes
  //
  452597397, // Exotic Shard
  1542293174, // Armor Materials
  1898539128, // Weapon Materials
  //
  937555249, // Motes of Light
  //
  1738186005, // Strange Coins
  //
  258181985, // Ascendant Shards
  1893498008, // Ascendant Energy
  769865458, // Radiant Shards
  616706469, // Radiant Energy
  //
  342707701, // Reciprocal Rune
  342707700, // Stolen Rune
  2906158273, // Antiquated Rune
  2620224196, // Stolen Rune (Charging)
  2906158273, // Antiquated Rune (Charging)
];

// Bucket IDs that'll never be sorted.
const ITEM_SORT_DENYLIST = new Set([
  D1BucketHashes.Bounties,
  D1BucketHashes.Missions,
  D1BucketHashes.Quests,
]);

// These comparators require knowledge of the tag state/database
const TAG_ITEM_COMPARATORS: {
  [key: string]: (getTag: (item: DimItem) => TagValue | undefined) => Comparator<DimItem>;
} = {
  // see tagConfig
  tag: (getTag) =>
    compareBy((item) => {
      const tag = getTag(item);
      return (tag && tagConfig[tag]?.sortOrder) ?? 1000;
    }),
  // not archive -> archive
  archive: (getTag) => compareBy((item) => getTag(item) === 'archive'),
};

export type VaultGroupValue = string | number | boolean | undefined;

interface VaultGroupIconNone {
  type: 'none';
}

interface VaultGroupIconTag {
  type: 'tag';
  tag: TagValue | undefined;
}

interface VaultGroupIconTypeName {
  type: 'typeName';
  itemCategoryHashes: number[];
}

interface VaultGroupIconAmmoType {
  type: 'ammoType';
  ammoType: DestinyAmmunitionType;
}

interface VaultGroupIconElementWeapon {
  type: 'elementWeapon';
  element: DestinyDamageTypeDefinition | null;
}

export type VaultGroupIcon =
  | VaultGroupIconNone
  | VaultGroupIconTag
  | VaultGroupIconTypeName
  | VaultGroupIconAmmoType
  | VaultGroupIconElementWeapon;

interface VaultGroup {
  groupingValue: VaultGroupValue;
  icon: VaultGroupIcon;
  items: DimItem[];
}

const groupingValueIndexInTagOrder = (input: VaultGroup) => {
  if (typeof input.groupingValue !== 'string') {
    return Infinity;
  }

  const index = vaultGroupTagOrder.indexOf(input.groupingValue as TagValue);

  if (index < 0) {
    return Infinity;
  }

  return index;
};
const groupingValueProperty = (input: VaultGroup) => input.groupingValue;

const undefinedVaultGroupLast =
  (comparator: Comparator<VaultGroup>) => (a: VaultGroup, b: VaultGroup) => {
    if (a.groupingValue === undefined) {
      if (b.groupingValue === undefined) {
        return 0;
      }

      return 1;
    }

    if (b.groupingValue === undefined) {
      return -1;
    }

    return comparator(a, b);
  };

const GROUP_BY_GETTERS_AND_COMPARATORS: {
  [key: string]: {
    comparator: Comparator<VaultGroup>;
    getValue: (item: DimItem, getTag: (item: DimItem) => TagValue | undefined) => VaultGroupValue;
    getIcon: (item: DimItem, getTag: (item: DimItem) => TagValue | undefined) => VaultGroupIcon;
  };
} = {
  tag: {
    comparator: undefinedVaultGroupLast(compareBy(groupingValueIndexInTagOrder)),
    getValue: (item, getTag) => getTag(item),
    getIcon: (item, getTag) => ({ type: 'tag', tag: getTag(item) }),
  },
  // A -> Z
  typeName: {
    comparator: undefinedVaultGroupLast(compareBy(groupingValueProperty)),
    getValue: (item) => item.typeName,
    getIcon: (item) => ({ type: 'typeName', itemCategoryHashes: item.itemCategoryHashes }),
  },
  // exotic -> common
  rarity: {
    comparator: undefinedVaultGroupLast(reverseComparator(compareBy(groupingValueProperty))),
    getValue: (item) => D2ItemTiers[item.tier],
    getIcon: () => ({ type: 'none' }),
  },
  // None -> Primary -> Special -> Heavy -> Unknown
  ammoType: {
    comparator: undefinedVaultGroupLast(compareBy(groupingValueProperty)),
    getValue: (item) => item.ammoType,

    getIcon: (item) => ({ type: 'ammoType', ammoType: item.ammoType }),
  },
  // None -> Kinetic -> Arc -> Thermal -> Void -> Raid -> Stasis
  elementWeapon: {
    comparator: undefinedVaultGroupLast(compareBy(groupingValueProperty)),
    getValue: (item) => {
      if (item.bucket.inWeapons) {
        return item.element?.enumValue ?? Number.MAX_SAFE_INTEGER;
      }
    },
    getIcon: (item) => {
      if (item.bucket.inWeapons) {
        return {
          type: 'elementWeapon',
          element: item.element,
        };
      }

      return {
        type: 'none',
      };
    },
  },
};

const ITEM_COMPARATORS: {
  [key: string]: Comparator<DimItem>;
} = {
  // A -> Z
  typeName: compareBy((item) => item.typeName),
  // exotic -> common
  rarity: reverseComparator(compareBy((item) => D2ItemTiers[item.tier])),
  // high -> low
  primStat: reverseComparator(compareBy((item) => item.primaryStat?.value ?? 0)),
  // high -> low
  basePower: reverseComparator(compareBy((item) => item.power)),
  // This only sorts by D1 item quality
  rating: reverseComparator(compareBy((item) => isD1Item(item) && item.quality?.min)),
  // Titan -> Hunter -> Warlock -> Unknown
  classType: compareBy((item) => item.classType),
  // None -> Primary -> Special -> Heavy -> Unknown
  ammoType: compareBy((item) => item.ammoType),
  // A -> Z
  name: compareBy((item) => item.name),
  // lots -> few
  amount: reverseComparator(compareBy((item) => item.amount)),
  // recent season -> old season
  season: reverseComparator(
    chainComparator(
      compareBy((item) => (item.destinyVersion === 2 ? getSeason(item) : 0)),
      compareBy((item) => item.iconOverlay ?? ''),
    ),
  ),
  // new -> old
  acquisitionRecency: acquisitionRecencyComparator,
  // None -> Kinetic -> Arc -> Thermal -> Void -> Raid -> Stasis
  elementWeapon: compareBy((item) => {
    if (item.bucket.inWeapons) {
      return item.element?.enumValue ?? Number.MAX_SAFE_INTEGER;
    }
  }),
  // masterwork -> not masterwork
  masterworked: compareBy((item) => (item.masterwork ? 0 : 1)),
  // crafted -> not crafted
  crafted: compareBy((item) => (item.crafted ? 0 : 1)),
  // deepsight -> no deepsight
  deepsight: compareBy((item) => (item.deepsightInfo ? 1 : 2)),
  default: () => 0,
};

/**
 * Sort items according to the user's preferences (via the sort parameter).
 * Returned array is readonly since it could either be a new array or the
 * original.
 */
export function sortItems(
  items: readonly DimItem[],
  itemSortSettings: ItemSortSettings,
  getTag: (item: DimItem) => TagValue | undefined,
): readonly DimItem[] {
  if (!items.length) {
    return items;
  }

  const itemLocationId = items[0].location.hash;
  if (!items.length || ITEM_SORT_DENYLIST.has(itemLocationId)) {
    return items;
  }

  let specificSortOrder: number[] = [];
  // Group like items in the General Section
  if (itemLocationId === BucketHashes.Consumables) {
    specificSortOrder = D1_CONSUMABLE_SORT_ORDER;
  }

  // Group like items in the General Section
  if (itemLocationId === BucketHashes.Materials) {
    specificSortOrder = D1_MATERIAL_SORT_ORDER;
  }

  if (specificSortOrder.length > 0 && !itemSortSettings.sortOrder.includes('rarity')) {
    items = _.sortBy(items, (item) => {
      const ix = specificSortOrder.indexOf(item.hash);
      return ix === -1 ? 999 : ix;
    });
    return items;
  }

  // Re-sort mods
  if (itemLocationId === BucketHashes.Modifications) {
    const comparators = [ITEM_COMPARATORS.typeName, ITEM_COMPARATORS.name];
    if (itemSortSettings.sortOrder.includes('rarity')) {
      comparators.unshift(ITEM_COMPARATORS.rarity);
    }
    return items.toSorted(chainComparator(...comparators));
  }

  // Re-sort consumables
  if (itemLocationId === BucketHashes.Consumables) {
    return items.toSorted(
      chainComparator(
        ITEM_COMPARATORS.typeName,
        ITEM_COMPARATORS.rarity,
        ITEM_COMPARATORS.name,
        ITEM_COMPARATORS.amount,
      ),
    );
  }

  // Engrams and Postmaster always sort by recency, oldest to newest, like in game
  if (itemLocationId === BucketHashes.Engrams || itemLocationId === BucketHashes.LostItems) {
    return items.toSorted(reverseComparator(acquisitionRecencyComparator));
  }

  // always sort by archive first
  const comparator = chainComparator(
    ...['archive', ...itemSortSettings.sortOrder].map((comparatorName) => {
      let comparator = ITEM_COMPARATORS[comparatorName];
      if (!comparator) {
        const tagComparator = TAG_ITEM_COMPARATORS[comparatorName]?.(getTag);

        if (!tagComparator) {
          return ITEM_COMPARATORS.default;
        }
        comparator = tagComparator;
      }

      return itemSortSettings.sortReversals.includes(comparatorName)
        ? reverseComparator(comparator)
        : comparator;
    }),
  );
  return items.toSorted(comparator);
}

export function groupItems(
  items: readonly DimItem[],
  vaultGrouping: string,
  getTag: (item: DimItem) => TagValue | undefined,
): readonly VaultGroup[] {
  const comparatorsAndGetters = GROUP_BY_GETTERS_AND_COMPARATORS[vaultGrouping];

  // If there are no items, or the grouping is not suppored, return all items in a single group
  if (!items.length || !comparatorsAndGetters) {
    return [{ groupingValue: undefined, icon: { type: 'none' }, items: [...items] }];
  }

  const { getValue, getIcon, comparator } = comparatorsAndGetters;

  const groupedItems = Map.groupBy(items, (item) => getValue(item, getTag));

  return Array.from(
    groupedItems.entries(),
    ([groupingValue, items]): VaultGroup => ({
      groupingValue,
      items,
      icon:
        groupingValue === undefined
          ? // Don't display an icon if they are ungrouped
            {
              type: 'none',
            }
          : getIcon(items[0], getTag),
    }),
  ).sort(comparator);
}

// Used to create string keys for vault grouping values
export const vaultGroupingValueWithType = (value: VaultGroupValue) => `${typeof value}-${value}`;
