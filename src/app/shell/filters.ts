import _ from 'lodash';
import { compareBy, reverseComparator, chainComparator, Comparator } from '../utils/comparators';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { characterSortSelector } from '../settings/character-sort';
import store from '../store/store';
import { getTag, tagConfig } from '../inventory/dim-item-info';
import { getRating } from '../item-review/reducer';
import { itemInfosSelector, itemHashTagsSelector } from 'app/inventory/selectors';
import {
  CONSUMABLES_BUCKET,
  MATERIALS_BUCKET,
  MODIFICATIONS_BUCKET,
} from 'app/search/d2-known-values';
// This file defines filters for DIM that may be shared among
// different parts of DIM.

export function percent(val: number): string {
  return `${Math.min(100, Math.floor(100 * val))}%`;
}

export function rarity(item: DimItem) {
  switch (item.tier) {
    case 'Exotic':
      return 0;
    case 'Legendary':
      return 1;
    case 'Rare':
      return 2;
    case 'Uncommon':
      return 3;
    case 'Common':
      return 4;
    default:
      return 5;
  }
}

/**
 * Sort the stores according to the user's preferences (via the order parameter).
 */
export function sortStores(stores: DimStore[]) {
  return characterSortSelector(store.getState())(stores);
}

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
// Don't resort postmaster items - that way people can see
// what'll get bumped when it's full.
const ITEM_SORT_DENYLIST = new Set([
  2197472680, // Bounties (D1)
  375726501, // Mission (D1)
  1801258597, // Quests (D1)
  215593132, // LostItems
]);

// TODO: pass in state
const ITEM_COMPARATORS: { [key: string]: Comparator<DimItem> } = {
  typeName: compareBy((item: DimItem) => item.typeName),
  rarity: compareBy(rarity),
  primStat: reverseComparator(compareBy((item: DimItem) => item.primStat?.value ?? 0)),
  basePower: reverseComparator(
    compareBy((item: DimItem) => item.basePower || item.primStat?.value)
  ),
  rating: reverseComparator(
    compareBy((item: DimItem & { quality: { min: number } }) => {
      if (item.quality?.min) {
        return item.quality.min;
      }
      const dtrRating = $featureFlags.reviewsEnabled
        ? getRating(item, store.getState().reviews.ratings)
        : undefined;
      return dtrRating?.overallScore;
    })
  ),
  classType: compareBy((item: DimItem) => item.classType),
  name: compareBy((item: DimItem) => item.name),
  amount: reverseComparator(compareBy((item: DimItem) => item.amount)),
  tag: compareBy((item: DimItem) => {
    const tag = getTag(
      item,
      itemInfosSelector(store.getState()),
      itemHashTagsSelector(store.getState())
    );
    return tag && tagConfig[tag] ? tagConfig[tag].sortOrder : 1000;
  }),
  archive: compareBy((item: DimItem) => {
    const tag = getTag(item, itemInfosSelector(store.getState()));
    return tag === 'archive';
  }),
  default: () => 0,
};

/**
 * Sort items according to the user's preferences (via the sort parameter).
 */
export function sortItems(items: DimItem[], itemSortOrder: string[]) {
  if (!items.length) {
    return items;
  }

  const itemLocationId = items[0].location.hash;
  if (!items.length || ITEM_SORT_DENYLIST.has(itemLocationId)) {
    return items;
  }

  let specificSortOrder: number[] = [];
  // Group like items in the General Section
  if (itemLocationId === CONSUMABLES_BUCKET) {
    specificSortOrder = D1_CONSUMABLE_SORT_ORDER;
  }

  // Group like items in the General Section
  if (itemLocationId === MATERIALS_BUCKET) {
    specificSortOrder = D1_MATERIAL_SORT_ORDER;
  }

  if (specificSortOrder.length > 0 && !itemSortOrder.includes('rarity')) {
    items = _.sortBy(items, (item) => {
      const ix = specificSortOrder.indexOf(item.hash);
      return ix === -1 ? 999 : ix;
    });
    return items;
  }

  // Re-sort mods
  if (itemLocationId === MODIFICATIONS_BUCKET) {
    const comparators = [ITEM_COMPARATORS.typeName, ITEM_COMPARATORS.name];
    if (itemSortOrder.includes('rarity')) {
      comparators.unshift(ITEM_COMPARATORS.rarity);
    }
    return items.sort(chainComparator(...comparators));
  }

  // Re-sort consumables
  if (itemLocationId === CONSUMABLES_BUCKET) {
    return items.sort(
      chainComparator(
        ITEM_COMPARATORS.typeName,
        ITEM_COMPARATORS.rarity,
        ITEM_COMPARATORS.name,
        ITEM_COMPARATORS.amount
      )
    );
  }

  // always sort by archive first
  const comparator = chainComparator(
    ...['archive', ...itemSortOrder].map((o) => ITEM_COMPARATORS[o] || ITEM_COMPARATORS.default)
  );
  return items.sort(comparator);
}

/**
 * A filter that will heatmap-color a background according to a percentage.
 */
export function getColor(value: number, property = 'background-color') {
  let color = 0;
  if (value < 0) {
    return { [property]: 'white' };
  } else if (value <= 85) {
    color = 0;
  } else if (value <= 90) {
    color = 20;
  } else if (value <= 95) {
    color = 60;
  } else if (value <= 99) {
    color = 120;
  } else if (value >= 100) {
    color = 190;
  }
  return {
    [property]: `hsla(${color},65%,50%, 1)`,
  };
}

export function dtrRatingColor(value: number, property = 'color') {
  if (!value) {
    return {};
  }

  let color;
  if (value < 2) {
    color = 'hsl(0,45%,45%)';
  } else if (value <= 3) {
    color = 'hsl(15,65%,40%)';
  } else if (value <= 4) {
    color = 'hsl(30,75%,45%)';
  } else if (value <= 4.4) {
    color = 'hsl(60,100%,30%)';
  } else if (value <= 4.8) {
    color = 'hsl(120,65%,40%)';
  } else if (value >= 4.9) {
    color = 'hsl(190,90%,45%)';
  }
  return {
    [property]: color,
  };
}

export function storeBackgroundColor(store: DimStore, index = 0, header = false) {
  if (!store.isDestiny2() || !store.color) {
    return undefined;
  }

  let color = store.color;

  if (!header && index % 2 === 1 && !store.isVault) {
    color = {
      red: color.red * 0.75,
      green: color.green * 0.75,
      blue: color.blue * 0.75,
      alpha: 1,
    };
  } else if (header) {
    color = {
      red: color.red * 0.25 + 49 * 0.75,
      green: color.green * 0.25 + 50 * 0.75,
      blue: color.blue * 0.25 + 51 * 0.75,
      alpha: 1,
    };
  }

  const alpha = header ? 1 : 0.25;

  const backgroundColor = `rgba(${Math.round(color.red)}, ${Math.round(color.green)}, ${Math.round(
    color.blue
  )}, ${alpha})`;

  return {
    backgroundColor,
  };
}
