import { stripAdept } from 'app/compare/compare-utils';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import {
  DEFAULT_SHADER,
  TOTAL_STAT_HASH,
  armorStats,
  customStatClasses,
  destinyClasses,
} from 'app/search/d2-known-values';
import { filterMap, isEmpty } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import {
  getArmor3StatFocus,
  getArmor3TuningStat,
  isArmor3,
  isArtifice,
} from 'app/utils/item-utils';
import { getArmorArchetypeSocket } from 'app/utils/socket-utils';
import { collectRelevantStatHashes, computeStatDupeLower } from 'app/utils/stats';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { ItemFilterDefinition } from '../item-filter-types';
import { deprecatedDupeFilters } from './dupes-deprecated';
import { PerksSet } from './perks-set';

type ItemFilterContext = Parameters<ItemFilterDefinition['filter']>[0];

// Return undefined from a key generator if that item does not belong in this dupe comparison at all.
const dupeTypeLookupRaw: Record<
  string,
  {
    keyGenerator: (item: DimItem) => string | undefined;
    confirmItemsInGroup?: (items: DimItem[], context: ItemFilterContext) => DimItem[];
  }
> = {
  // Simple, classic is:dupe behavior. Finds items that look like each other, and groups them together.
  item: { keyGenerator: itemDupeID },

  // Groups items by their base stats.
  // Considers two pieces with the same stats, but different tuner mods (or one item has artifice/tuner) to be different.
  stats: {
    keyGenerator: (item) => {
      if (isStatRelevantArmor(item)) {
        // *Stat-related* reasons an item's stats might not be directly comparable to another item's.
        const statExceptionKey = isArtifice(item) ? 'artifice' : getArmor3TuningStat(item);

        const statValues = filterMap(item.stats!, (s) => {
          if (armorStats.includes(s.statHash)) {
            return `#${s.statHash}:${s.base}#`;
          }
        });
        return `${statExceptionKey}|${item.classType}|${item.bucket.name}|${item.isExotic}|${statValues.join()}`;
      }
    },
  },

  // This is a bad filter but the customer is always right.
  // Uses base stats, and ignores the fact that T5 tuner mods exist.
  untunedstats: {
    keyGenerator: (item) => {
      if (isStatRelevantArmor(item)) {
        const statValues = filterMap(item.stats!, (s) => {
          if (armorStats.includes(s.statHash)) {
            return `#${s.statHash}:${s.base}#`;
          }
        });
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${statValues.join()}`;
      }
    },
  },

  // Groups items by their archetype.
  archetype: {
    keyGenerator: (item) => {
      const archetype = getArmorArchetypeSocket(item);
      if (archetype) {
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${archetype.plugged?.plugDef.hash}`;
      }
    },
  },

  // Groups items by their tertiary stat (the non-zero one on armor 3.0 that isn't controlled by archetype).
  tertiarystat: {
    keyGenerator: (item) => {
      if (isArmor3(item) && isStatRelevantArmor(item)) {
        const tertiaryStatHash = getArmor3StatFocus(item)[2];
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${tertiaryStatHash}`;
      }
    },
  },

  // Groups armor 3.0 by the trio of stats they have a non-zero base stat in.
  nonzerostats: {
    keyGenerator: (item) => {
      if (isArmor3(item) && isStatRelevantArmor(item)) {
        const nonZeroStats = getArmor3StatFocus(item).sort();
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${nonZeroStats.join()}`;
      }
    },
  },

  // Groups items by their tuned stat, a controllable +5 on Tier 5 armor 3.0.
  tunedstat: {
    keyGenerator: (item) => {
      if (isArmor3(item) && isStatRelevantArmor(item)) {
        const tertiaryStatHash = getArmor3StatFocus(item)[2];
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${tertiaryStatHash}`;
      }
    },
  },

  // Finds items with the same set bonus. Not useful in isolation, but good for narrowing statlower computations.
  setbonus: {
    keyGenerator: (item) => {
      if (item.setBonus) {
        return `${item.classType}|${item.bucket.name}|${item.isExotic}|${item.setBonus.hash}`;
      }
    },
  },

  // Finds items with all the same perks or which contain a subset that comprises another item's perks.
  perks: {
    keyGenerator: (item) =>
      `${item.bucket.hash}|${item.classType}|${item.isExotic}|${item.typeName}`,
    confirmItemsInGroup: (items) => {
      items = items.filter((i) =>
        i.sockets?.allSockets.some((s) => s.isPerk && s.socketDefinition.defaultVisible),
      );

      const perksSet = new PerksSet(items);
      return items.filter((i) => perksSet.hasPerkDupes(i));
    },
  },

  // "LOWER" CALCULATORS.
  // These do little key-based dupe-ness narrowing of their own (except narrowing items to armor, currently).
  // They process last in line among dupe filters, after other dupe types have grouped items,
  // allowing "lowest within matching set bonus" or "lowest among armor with the same archetype"

  statlower: {
    keyGenerator: (item) => {
      if (isStatRelevantArmor(item)) {
        // computeStatDupeLower already computes items by bucket. No need to partition here.
        return '';
      }
    },
    // Run lower computer against each group to decide which are lower.
    confirmItemsInGroup: (items) => {
      const lowerIds = computeStatDupeLower(items);
      return items.filter((i) => lowerIds.has(i.id));
    },
  },

  // Currently checks to see if EVERY STAT on a piece, within EVERY CUSTOM STAT TOTAL, is beat by every stat
  // on some other piece in the same slot for the same guardian class.
  // Every additional custom stat will narrow this filter's result.
  customstatlower: {
    keyGenerator: (item) => {
      if (isStatRelevantArmor(item)) {
        // computeStatDupeLower already computes items by bucket. No need to partition here.
        return '';
      }
    },
    // Run lower computer against each group to decide which are lower.
    confirmItemsInGroup: (allArmors, { customStats }) => {
      const armorsByDestinyClass = Map.groupBy(allArmors, (i) => i.classType);

      // Empty the itemset for classes with no applicable custom stat.
      const existingCustomStatClasses = Array.from(new Set(customStats.map((s) => s.class)));
      for (const destinyClass of armorsByDestinyClass.keys()) {
        if (
          !existingCustomStatClasses.includes(DestinyClass.Unknown) &&
          !existingCustomStatClasses.includes(destinyClass)
        ) {
          armorsByDestinyClass.set(destinyClass, []);
        }
      }

      // Fill each class with an empty array so we can assert! they are found later.
      for (const destinyClass of customStatClasses) {
        if (!armorsByDestinyClass.has(destinyClass)) {
          armorsByDestinyClass.set(destinyClass, []);
        }
      }

      for (const customStat of customStats) {
        const thisStatClassArmors =
          customStat.class === DestinyClass.Unknown
            ? allArmors
            : armorsByDestinyClass.get(customStat.class)!;

        const relevantStatHashes = collectRelevantStatHashes(customStat.weights);
        const thisStatLowerIds = computeStatDupeLower(thisStatClassArmors, relevantStatHashes);
        const armorSetsToNarrow =
          customStat.class === DestinyClass.Unknown ? destinyClasses : [customStat.class];
        for (const destinyClass of armorSetsToNarrow) {
          armorsByDestinyClass.set(
            destinyClass,
            armorsByDestinyClass.get(destinyClass)!.filter((i) => thisStatLowerIds.has(i.id)),
          );
        }
      }

      return destinyClasses.flatMap((destinyClass) => armorsByDestinyClass.get(destinyClass)!);
    },
  },
};

const lowerComparatorTypes = ['statlower', 'customstatlower'];

const dupeFilters: ItemFilterDefinition[] = [
  {
    keywords: ['dupe'],
    format: ['multiquery', 'simple'],
    suggestions: Object.keys(dupeTypeLookupRaw),
    suggestionsGenerator: () => [
      'is:dupe',
      'dupe:stats',
      'dupe:archetype+tertiarystat',
      'dupe:nonzerostats',
      'dupe:setbonus+statlower',
      'dupe:perks',
      'dupe:statlower',
      'dupe:customstatlower',
    ],
    description: {
      item: tl('Filter.Dupe'),
      stats: tl('Filter.DupeStats'),
      untunedstats: tl('Filter.DupeUntunedStats'),
      archetype: tl('Filter.DupeArchetype'),
      tertiarystat: tl('Filter.DupeTertiary'),
      nonzerostats: tl('Filter.DupeZeroStats'),
      tunedstat: tl('Filter.DupeTunedStat'),
      setbonus: tl('Filter.DupeSetBonus'),
      perks: tl('Filter.DupePerks'),
      statlower: tl('Filter.StatLower'),
      customstatlower: tl('Filter.CustomStatLower'),
    },
    destinyVersion: 2,
    filter: (context) => {
      const { allItems } = context;
      let { filterValue } = context;
      if (filterValue === 'dupe') {
        filterValue = 'item';
      }
      const dupeTypes = filterValue.split('+');

      const invalidDupeTypes = dupeTypes.filter((t) => !(t in dupeTypeLookupRaw));
      if (invalidDupeTypes.length) {
        throw new Error(`Invalid dupe identifiers: ${invalidDupeTypes.join()}`);
      }

      // Run "lower" measurers last, so their confirmItemsInGroup functions are run against a reduced subset of items
      dupeTypes.sort(compareBy((t) => lowerComparatorTypes.includes(t)));

      const collector: Record<string, DimItem[]> = {};
      itemLoop: for (const item of allItems) {
        const keys = [];
        for (const dupeType of dupeTypes) {
          const key = dupeTypeLookupRaw[dupeType].keyGenerator(item);
          if (key === undefined) {
            continue itemLoop;
          }
          keys.push(key);
        }

        if (keys.length) {
          // Check shouldn't be strictly necessary but it helps ensure no surprises.
          (collector[keys.join('%%')] ??= []).push(item);
        }
      }

      if (isEmpty(collector)) {
        throw new Error(`No items passed the inclusion conditions of all filters: ${filterValue}`);
      }

      const dupes = new Set<string>();
      for (const key in collector) {
        let items = collector[key];

        for (const dupeType of dupeTypes) {
          const confirmFunction = dupeTypeLookupRaw[dupeType].confirmItemsInGroup;
          if (confirmFunction) {
            items = confirmFunction(items, context);
          }
        }
        if (
          // If "lower" measurers were involved, anything that has passed the confirmItemsInGroup is a "lower" and should be highlighted.
          dupeTypes.some((t) => lowerComparatorTypes.includes(t)) ||
          // Otherwise, items have been sorted into unique identifier arrays, and if an array has more than one item,
          // then they had the same unique identifier and should be marked dupes.
          items.length > 1
        ) {
          for (const item of items) {
            dupes.add(item.id);
          }
        }
      }
      return (item) =>
        // I do not know why this is necessary, how is a DEFAULT_SHADER being dupe checked?
        item.hash !== DEFAULT_SHADER &&
        item.bucket.hash !== BucketHashes.SeasonalArtifact &&
        item.comparable &&
        dupes.has(item.id);
    },
  },
  {
    keywords: 'count',
    description: tl('Filter.DupeCount'),
    format: 'range',
    filter: ({ compare, allItems }) => {
      const duplicates = computeDupes(allItems);
      return (item) => {
        const dupeId = itemDupeID(item);
        return compare!(duplicates[dupeId]?.length ?? 0);
      };
    },
  },

  ...deprecatedDupeFilters,
];

export default dupeFilters;

function isStatRelevantArmor(item: DimItem) {
  return (
    // This filter is for armor with stats
    item.bucket.inArmor &&
    item.stats &&
    // Allow all non-class items
    (item.bucket.hash !== BucketHashes.ClassArmor ||
      // Older class items have no base stats. Allow if there's base stats.
      (item.stats.find((s) => s.statHash === TOTAL_STAT_HASH)?.base !== 0 &&
        // Exotic class items all have identical stats. Allow others.
        item.rarity !== 'Exotic'))
  );
}

/** outputs a string combination of the identifying features of an item, or the hash if classified */
export function itemDupeID(item: DimItem) {
  return (
    (item.classified && `${item.hash}`) ||
    `${
      // Consider adept versions of weapons to be the same as the normal type
      item.bucket.inWeapons ? stripAdept(item.name) : item.name
    }${
      // Some items have the same name across different classes, e.g. "Kairos Function Boots"
      item.classType
    }${
      // Some items have the same name across different tiers, e.g. "Traveler's Chosen"
      item.rarity
    }${
      // The engram that dispenses the Taraxippos scout rifle is also called Taraxippos
      item.bucket.hash
    }`
  );
}

export function computeDupes(allItems: DimItem[]) {
  // Holds a map from item hash to count of occurrences of that hash
  const duplicates: { [dupeID: string]: DimItem[] } = {};

  for (const i of allItems) {
    if (!i.comparable) {
      continue;
    }
    const dupeID = itemDupeID(i);
    if (!duplicates[dupeID]) {
      duplicates[dupeID] = [];
    }
    duplicates[dupeID].push(i);
  }

  return duplicates;
}
