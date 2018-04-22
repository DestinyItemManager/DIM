import { module } from 'angular';
import * as _ from 'underscore';
import { bungieNetPath } from '../dim-ui/bungie-image';
import { compareBy, reverseComparator, chainComparator, Comparator } from '../comparators';
import { settings } from '../settings/settings';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';

// This file defines Angular filters for DIM that may be shared among
// different parts of DIM.

const mod = module('dimAngularFilters', []);
const name = mod.name;
export default name;

/**
 * Take an icon path and make a full Bungie.net URL out of it
 */
mod.filter('bungieIcon', ($sce) => {
  return function bungieIcon(icon) {
    return $sce.trustAsResourceUrl(bungieNetPath(icon));
  };
});

/**
 * Set the background-image of an element to a bungie icon URL.
 */
mod.filter('bungieBackground', () => {
  return function backgroundImage(value) {
    if (!value) {
      return {};
    }

    // Hacky workaround so we can reference local images
    if (value.startsWith('~')) {
      const baseUrl = ($DIM_FLAVOR === 'dev')
        ? ''
        : 'https://beta.destinyitemmanager.com';
      return {
        'background-image': `url(${baseUrl}${value.substr(1)})`
      };
    }
    return {
      'background-image': `url(https://www.bungie.net${value})`
    };
  };
});

/**
 * Filter a list of items down to only the equipped (or unequipped) items.
 * Usage: items | equipped:true
 */
mod.filter('equipped', () => {
  return function equipped(items: DimItem[], isEquipped) {
    return (items || []).filter((item) => item.equipped === isEquipped);
  };
});

function rarity(item: DimItem) {
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
mod.filter('sortStores', () => sortStores);

export function sortStores(stores: DimStore[], order) {
  if (order === 'mostRecent') {
    return _.sortBy(stores, 'lastPlayed').reverse();
  } else if (order === 'mostRecentReverse') {
    return _.sortBy(stores, (store) => {
      if (store.isVault) {
        return Infinity;
      } else {
        return store.lastPlayed;
      }
    });
  } else if (stores.length && stores[0].destinyVersion === 1) {
    return _.sortBy(stores, 'id');
  } else {
    return stores;
  }
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
  4244618453 // Splicer Key
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
  2906158273 // Antiquated Rune (Charging)
];

// Bucket IDs that'll never be sorted.
// Don't resort postmaster items - that way people can see
// what'll get bumped when it's full.
const ITEM_SORT_BLACKLIST = new Set([
  "BUCKET_BOUNTIES",
  "BUCKET_MISSION",
  "BUCKET_QUESTS",
  "BUCKET_POSTMASTER",
  '215593132' // LostItems
]);

const ITEM_COMPARATORS: { [key: string]: Comparator<DimItem> } = {
  typeName: compareBy((item: DimItem) => item.typeName),
  rarity: compareBy(rarity),
  primStat: reverseComparator(compareBy((item: DimItem) => item.primStat && item.primStat.value)),
  basePower: reverseComparator(compareBy((item: DimItem) => item.basePower || (item.primStat && item.primStat.value))),
  rating: reverseComparator(compareBy((item: DimItem & { quality: { min: number }}) => (item.quality && item.quality.min) ? item.quality.min : item.dtrRating)),
  classType: compareBy((item: DimItem) => item.classType),
  name: compareBy((item: DimItem) => item.name),
  amount: reverseComparator(compareBy((item: DimItem) => item.amount)),
  default: (_a, _b) => 0
};

mod.filter('sortItems', () => sortItems);

/**
 * Sort items according to the user's preferences (via the sort parameter).
 */
export function sortItems(items: DimItem[]) {
  if (!items.length) {
    return items;
  }

  const itemLocationId = items[0].location.id.toString();
  if (!items.length || ITEM_SORT_BLACKLIST.has(itemLocationId)) {
    return items;
  }

  let specificSortOrder: number[] = [];
  // Group like items in the General Section
  if (itemLocationId === "BUCKET_CONSUMABLES") {
    specificSortOrder = D1_CONSUMABLE_SORT_ORDER;
  }

  // Group like items in the General Section
  if (itemLocationId === "BUCKET_MATERIALS") {
    specificSortOrder = D1_MATERIAL_SORT_ORDER;
  }

  const sortOrder: string[] = settings.itemSortOrder();

  if (specificSortOrder.length > 0 && !sortOrder.includes('rarity')) {
    items = _.sortBy(items, (item) => {
      const ix = specificSortOrder.indexOf(item.hash);
      return (ix === -1) ? 999 : ix;
    });
    return items;
  }

  // Re-sort mods
  if (itemLocationId === '3313201758') {
    const comparators = [ITEM_COMPARATORS.typeName, ITEM_COMPARATORS.name];
    if (sortOrder.includes('rarity')) {
      comparators.unshift(ITEM_COMPARATORS.rarity);
    }
    return items.sort(chainComparator(...comparators));
  }

  // Re-sort consumables
  if (itemLocationId === '1469714392') {
    return items.sort(chainComparator(
      ITEM_COMPARATORS.typeName,
      ITEM_COMPARATORS.rarity,
      ITEM_COMPARATORS.name,
      ITEM_COMPARATORS.amount
    ));
  }

  // Re-sort shaders
  if (items[0].location.id === 2973005342) {
    // Just sort by name
    return items.sort(ITEM_COMPARATORS.name);
  }

  const comparator = chainComparator(...sortOrder.map((o) => ITEM_COMPARATORS[o] || ITEM_COMPARATORS.default));
  return items.sort(comparator);
}

mod.filter('qualityColor', () => getColor);

/**
 * A filter that will heatmap-color a background according to a percentage.
 */
export function getColor(value: number, property: string) {
  property = property || 'background-color';
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
  const result = {};
  result[property] = `hsla(${color},65%,50%, .85)`;
  return result;
}

export function dtrRatingColor(value: number, property?: string) {
  if (!value) {
    return {};
  }

  property = property || 'color';
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
  const result = {};
  result[property] = color;
  return result;
}

mod.filter('dtrRatingColor', () => dtrRatingColor);

/**
 * Reduce a string to its first letter.
 */
mod.filter('firstLetter', () => {
  return (str) => {
    return str.substring(0, 1);
  };
});

/**
 * Filter to turn a number into an array so that we can use ng-repeat
 * over a number to loop N times.
 */
mod.filter('range', () => {
  return (n) => {
    return new Array(n);
  };
});

/**
 * inserts the evaluated value of the "svg-bind-viewbox" attribute
 * into the "viewBox" attribute, making sure to capitalize the "B",
 * as this SVG attribute name is case-sensitive.
 */
mod.directive('svgBindViewbox', () => {
  return {
    link: (_scope, element, attrs) => {
      attrs.$observe('svgBindViewbox', (value: string) => {
        element[0].setAttribute('viewBox', value);
      });
    }
  };
});
