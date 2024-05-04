import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DIM_LANG_INFOS, DimLanguage } from 'app/i18n';
import { tl } from 'app/i18next-t';
import { DimItem, DimPlug } from 'app/inventory/item-types';
import { filterMap } from 'app/utils/collections';
import { isD1Item } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import memoizeOne from 'memoize-one';
import { FilterDefinition } from '../filter-types';
import { quoteFilterString } from '../query-parser';

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = (language: DimLanguage) => DIM_LANG_INFOS[language].latinBased;

/** escape special characters for a regex */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove diacritics from latin-based string */
function latinize(s: string, language: DimLanguage) {
  return isLatinBased(language) ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '') : s;
}

/** Make a Regexp that searches starting at a word boundary */
export function startWordRegexp(s: string, language: DimLanguage) {
  // Only some languages effectively use the \b regex word boundary
  return new RegExp(`${isLatinBased(language) ? '\\b' : ''}${escapeRegExp(s)}`, 'i');
}

/** returns input string toLower, and stripped of accents if it's a latin language */
export const plainString = (s: string, language: DimLanguage): string =>
  latinize(s, language).toLowerCase();

const interestingPlugTypes = new Set([PlugCategoryHashes.Frames, PlugCategoryHashes.Intrinsics]);
const getPerkNamesFromManifest = memoizeOne(
  (allItems: { [hash: number]: DestinyInventoryItemDefinition }) =>
    filterMap(Object.values(allItems), (item) => {
      const pch = item.plug?.plugCategoryHash;
      return pch && interestingPlugTypes.has(pch)
        ? item.displayProperties.name.toLowerCase() || undefined
        : undefined;
    }),
);

// things that are sunset            1010        1060        1060        1260
const irrelevantPowerCaps = new Set([2471437758, 1862490583, 1862490584, 1862490585]);

const getUniqueItemNamesFromManifest = memoizeOne(
  (allManifestItems: { [hash: number]: DestinyInventoryItemDefinition }) => {
    const itemNames = Object.values(allManifestItems)
      .filter((i) => {
        if (!i.itemCategoryHashes) {
          return false;
        }
        const isWeaponOrArmor =
          i.itemCategoryHashes.includes(ItemCategoryHashes.Weapon) ||
          i.itemCategoryHashes.includes(ItemCategoryHashes.Armor);
        if (!i.displayProperties.name || !isWeaponOrArmor) {
          return false;
        }
        const { quality } = i;
        const powerCap = quality?.versions[quality.currentVersion].powerCapHash;
        // don't suggest outdated items from the manifest
        // (user's owned items will be included regardless)
        return !powerCap || !irrelevantPowerCaps.has(powerCap);
      })
      .map((i) => i.displayProperties.name.toLowerCase());
    return [...new Set(itemNames)];
  },
);

/**
 * Create a case-/diacritic-insensitive matching predicate for name / perkname filters.
 * Requires an exact match if `exact`, otherwise partial.
 */
export function matchText(value: string, language: DimLanguage, exact: boolean) {
  const normalized = plainString(value, language);
  if (exact) {
    return (s: string) => normalized === plainString(s, language);
  } else {
    const startWord = startWordRegexp(normalized, language);
    return (s: string) => startWord.test(plainString(s, language));
  }
}

const nameFilter = {
  keywords: ['name', 'exactname'],
  description: tl('Filter.Name'),
  format: 'freeform',
  suggestionsGenerator: ({ d2Manifest, allItems }) => {
    if (d2Manifest && allItems) {
      const myItemNames = allItems
        .filter(
          (i) =>
            i.bucket.inWeapons || i.bucket.inArmor || i.bucket.inGeneral || i.bucket.inInventory,
        )
        .map((i) => i.name.toLowerCase());
      // favor items we actually own
      const allItemNames = getUniqueItemNamesFromManifest(d2Manifest.InventoryItem.getAll());
      return Array.from(
        new Set([...myItemNames, ...allItemNames]),
        (s) => `exactname:${quoteFilterString(s)}`,
      );
    }
  },
  filter: ({ filterValue, language, lhs }) => {
    const test = matchText(filterValue, language, /* exact */ lhs === 'exactname');
    return (item) => test(item.name);
  },
  fromItem: (item) => `exactname:${quoteFilterString(item.name)}`,
} satisfies FilterDefinition;

const freeformFilters: FilterDefinition[] = [
  nameFilter,
  {
    keywords: 'notes',
    description: tl('Filter.Notes'),
    format: 'freeform',
    suggestionsGenerator: ({ allNotesHashtags }) => allNotesHashtags,
    filter: ({ filterValue, getNotes, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => {
        const notes = getNotes(item);
        return Boolean(notes && plainString(notes, language).includes(filterValue));
      };
    },
  },
  {
    keywords: 'description',
    description: tl('Filter.DescriptionFilter'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => plainString(item.description, language).includes(filterValue);
    },
  },
  {
    keywords: 'perk',
    description: tl('Filter.Perk'),
    format: 'freeform',
    filter: ({ filterValue, language, d2Definitions }) => {
      const startWord = startWordRegexp(plainString(filterValue, language), language);
      const test = (s: string) => startWord.test(plainString(s, language));
      return (item) =>
        (isD1Item(item) &&
          item.talentGrid &&
          testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes)) ||
        (item.sockets && testStringsFromAllSockets(test, item, d2Definitions));
    },
  },
  {
    keywords: ['perkname', 'exactperk'],
    description: tl('Filter.PerkName'),
    format: 'freeform',
    suggestionsGenerator: ({ d2Manifest, allItems }) => {
      if (d2Manifest && allItems) {
        const perkNames = new Set<string>();
        // favor items we actually own by inserting them first
        for (const item of allItems) {
          if (
            item.sockets &&
            (item.bucket.inWeapons || item.bucket.inArmor || item.bucket.inGeneral)
          ) {
            for (const socket of item.sockets.allSockets) {
              if (socket.isPerk) {
                for (const plug of socket.plugOptions) {
                  perkNames.add(plug.plugDef.displayProperties.name.toLowerCase());
                }
              }
            }
          }
        }

        // supplement the list with perks from definitions, so people can search things they don't own
        for (const perkName of getPerkNamesFromManifest(d2Manifest.InventoryItem.getAll())) {
          perkNames.add(perkName);
        }

        return Array.from(perkNames, (s) => `exactperk:${quoteFilterString(s)}`);
      }
    },
    filter: ({ lhs, filterValue, language, d2Definitions }) => {
      const test = matchText(filterValue, language, /* exact */ lhs === 'exactperk');
      return (item) =>
        (isD1Item(item) &&
          testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes, false)) ||
        testStringsFromAllSockets(test, item, d2Definitions, /* includeDescription */ false);
    },
  },
  {
    keywords: 'keyword',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, getNotes, language, d2Definitions }) => {
      filterValue = plainString(filterValue, language);
      const test = (s: string) => plainString(s, language).includes(filterValue);
      return (item) => {
        const notes = getNotes(item);
        return (
          (notes && test(notes)) ||
          test(item.name) ||
          test(item.description) ||
          test(item.typeName) ||
          (isD1Item(item) && testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes)) ||
          testStringsFromAllSockets(test, item, d2Definitions) ||
          (d2Definitions &&
            (testStringsFromObjectives(test, d2Definitions, item.objectives) ||
              testStringsFromRewards(test, d2Definitions, item.pursuit)))
        );
      };
    },
  },
];

export default freeformFilters;

/**
 * feed in an object with a `name` and a `description` property,
 * to get an array of just those strings
 */
function testStringsFromDisplayProperties<T extends { name: string; description: string }>(
  test: (str: string) => boolean,
  displayProperties?: T,
  includeDescription = true,
): boolean {
  if (!displayProperties) {
    return false;
  }

  return Boolean(
    (displayProperties.name && test(displayProperties.name)) ||
      (includeDescription && displayProperties.description && test(displayProperties.description)),
  );
}

/**
 * feed in an object or objects with a `name` and a `description` property
 */
function testStringsFromDisplayPropertiesMap<T extends { name: string; description: string }>(
  test: (str: string) => boolean,
  displayProperties?: T | T[] | null,
  includeDescription = true,
): boolean {
  if (!displayProperties) {
    return false;
  }
  if (!Array.isArray(displayProperties)) {
    return testStringsFromDisplayProperties(test, displayProperties, includeDescription);
  }
  return displayProperties.some((d) =>
    testStringsFromDisplayProperties(test, d, includeDescription),
  );
}

function testStringsFromObjectives(
  test: (str: string) => boolean,
  defs: D2ManifestDefinitions,
  objectives: DimItem['objectives'],
): boolean {
  return Boolean(
    objectives?.some((o) => test(defs.Objective.get(o.objectiveHash)?.progressDescription ?? '')),
  );
}

function testStringsFromRewards(
  test: (str: string) => boolean,
  defs: D2ManifestDefinitions,
  pursuitInfo: DimItem['pursuit'],
): boolean {
  return Boolean(
    pursuitInfo?.rewards.some((r) =>
      testStringsFromDisplayProperties(test, defs.InventoryItem.get(r.itemHash).displayProperties),
    ),
  );
}

/** includes name and description unless you set the arg2 flag */
function testStringsFromAllSockets(
  test: (str: string) => boolean,
  item: DimItem,
  defs: D2ManifestDefinitions | undefined,
  includeDescription = true,
): boolean {
  if (!item.sockets) {
    return false;
  }
  for (const socket of item.sockets.allSockets) {
    for (const plug of socket.plugOptions) {
      if (
        testStringsFromDisplayPropertiesMap(
          test,
          plug.plugDef.displayProperties,
          includeDescription,
        ) ||
        test(plug.plugDef.itemTypeDisplayName) ||
        (defs &&
          getPlugPerks(plug, defs).some((perk) =>
            testStringsFromDisplayPropertiesMap(test, perk.displayProperties, includeDescription),
          ))
      ) {
        return true;
      }
    }
    // include tooltips from the plugged item
    if (socket.plugged?.plugDef.tooltipNotifications) {
      for (const t of socket.plugged.plugDef.tooltipNotifications) {
        if (test(t.displayString)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getPlugPerks(plug: DimPlug, defs: D2ManifestDefinitions) {
  return (plug.plugDef.perks || []).map((perk) => defs.SandboxPerk.get(perk.perkHash));
}
