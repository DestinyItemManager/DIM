import { DimItem } from 'app/inventory/item-types';
import { itemHashTagsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { getSeason } from 'app/inventory/store/season';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { D2ItemTiers } from 'app/search/d2-known-values';
import { isSunset } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { getTag, tagConfig } from '../inventory/dim-item-info';
import store from '../store/store';
import { chainComparator, Comparator, compareBy, reverseComparator } from '../utils/comparators';

export const acquisitionRecencyComparator = reverseComparator(
  compareBy((item: DimItem) => item.id.padStart(20, '0'))
);

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

// TODO: pass in state
const ITEM_COMPARATORS: { [key: string]: Comparator<DimItem> } = {
  typeName: compareBy((item: DimItem) => item.typeName),
  rarity: reverseComparator(compareBy((item: DimItem) => D2ItemTiers[item.tier])),
  primStat: reverseComparator(compareBy((item: DimItem) => item.primaryStat?.value ?? 0)),
  basePower: reverseComparator(compareBy((item: DimItem) => item.power)),
  // This only sorts by D1 item quality
  rating: reverseComparator(
    compareBy((item: DimItem & { quality: { min: number } }) => {
      if (item.quality?.min) {
        return item.quality.min;
      }
      return undefined;
    })
  ),
  classType: compareBy((item: DimItem) => item.classType),
  ammoType: compareBy((item: DimItem) => item.ammoType),
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
  season: reverseComparator(
    chainComparator(
      compareBy((item: DimItem) => (item.destinyVersion === 2 ? getSeason(item) : 0)),
      compareBy((item: DimItem) => item.iconOverlay ?? '')
    )
  ),
  sunset: compareBy(isSunset),
  archive: compareBy((item: DimItem) => {
    const tag = getTag(item, itemInfosSelector(store.getState()));
    return tag === 'archive';
  }),
  acquisitionRecency: acquisitionRecencyComparator,
  element: compareBy((item: DimItem) => item.element?.enumValue ?? Number.MAX_SAFE_INTEGER),
  masterworked: compareBy((item: DimItem) => (item.masterwork ? 0 : 1)),
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
  if (itemLocationId === BucketHashes.Consumables) {
    specificSortOrder = D1_CONSUMABLE_SORT_ORDER;
  }

  // Group like items in the General Section
  if (itemLocationId === BucketHashes.Materials) {
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
  if (itemLocationId === BucketHashes.Modifications) {
    const comparators = [ITEM_COMPARATORS.typeName, ITEM_COMPARATORS.name];
    if (itemSortOrder.includes('rarity')) {
      comparators.unshift(ITEM_COMPARATORS.rarity);
    }
    return items.sort(chainComparator(...comparators));
  }

  // Re-sort consumables
  if (itemLocationId === BucketHashes.Consumables) {
    return items.sort(
      chainComparator(
        ITEM_COMPARATORS.typeName,
        ITEM_COMPARATORS.rarity,
        ITEM_COMPARATORS.name,
        ITEM_COMPARATORS.amount
      )
    );
  }

  // Engrams and Postmaster always sort by recency, oldest to newest, like in game
  if (itemLocationId === BucketHashes.Engrams || itemLocationId === BucketHashes.LostItems) {
    return items.sort(reverseComparator(acquisitionRecencyComparator));
  }

  // always sort by archive first
  const comparator = chainComparator(
    ...['archive', ...itemSortOrder].map((o) => ITEM_COMPARATORS[o] || ITEM_COMPARATORS.default)
  );
  return items.sort(comparator);
}
