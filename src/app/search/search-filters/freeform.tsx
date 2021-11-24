import { tl } from 'app/i18next-t';
import { getNotes } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import latinise from 'voca/latinise';
import { FilterDefinition } from '../filter-types';

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = memoizeOne((language: string) =>
  ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
);

/** escape special characters for a regex */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Make a Regexp that searches starting at a word boundary */
export function startWordRegexp(s: string, language: string) {
  // Only some languages effectively use the \b regex word boundary
  return new RegExp(`${isLatinBased(language) ? '\\b' : ''}${escapeRegExp(s)}`, 'i');
}

/** returns input string toLower, and stripped of accents if it's a latin language */
const plainString = (s: string, language: string): string =>
  (isLatinBased(language) ? latinise(s) : s).toLowerCase();

const interestingPlugTypes = new Set([PlugCategoryHashes.Frames, PlugCategoryHashes.Intrinsics]);
const getPerkNamesFromManifest = _.once((allItems: DestinyInventoryItemDefinition[]) => {
  const perkNames = allItems
    .filter((i) => {
      const pch = i.plug?.plugCategoryHash;
      return i.displayProperties.name && pch && interestingPlugTypes.has(pch);
    })
    .map((i) => i.displayProperties.name);
  return _.uniq(perkNames);
});

// things that are sunset            1010        1060        1060        1260
const irrelevantPowerCaps = new Set([2471437758, 1862490583, 1862490584, 1862490585]);

const getUniqueItemNamesFromManifest = _.once(
  (allManifestItems: DestinyInventoryItemDefinition[]) => {
    const itemNames = allManifestItems
      .filter((i) => {
        const isWeaponOrArmor =
          i.itemCategoryHashes?.includes(ItemCategoryHashes.Weapon) ||
          i.itemCategoryHashes?.includes(ItemCategoryHashes.Armor);
        if (!i.displayProperties.name || !isWeaponOrArmor) {
          return false;
        }
        const { quality } = i;
        const powerCap = quality?.versions[quality.currentVersion].powerCapHash;
        // don't suggest outdated items from the manifest
        // (user's owned items will be included regardless)
        return !powerCap || !irrelevantPowerCaps.has(powerCap);
      })
      .map((i) => i.displayProperties.name);
    return _.uniq(itemNames);
  }
);

export const nameFilter: FilterDefinition = {
  keywords: 'name',
  description: tl('Filter.PartialMatch'),
  format: 'freeform',
  // could we do this with a for loop faster,
  // with wayyyyy more lines of code?? absolutely
  suggestionsGenerator: ({ d2Manifest, allItems }) => {
    if (d2Manifest && allItems) {
      const myItemNames = allItems
        .filter((i) => i.bucket.inWeapons || i.bucket.inArmor || i.bucket.inGeneral)
        .map((i) => i.name);
      // favor items we actually own
      const allItemNames = getUniqueItemNamesFromManifest(
        Object.values(d2Manifest.InventoryItem.getAll())
      );
      return _.uniq([...myItemNames, ...allItemNames]).map(
        (s) => `name:${quoteFilterString(s.toLowerCase())}`
      );
    }
  },
  filter: ({ filterValue, language }) => {
    filterValue = plainString(filterValue, language);
    return (item) => plainString(item.name, language).includes(filterValue);
  },
  fromItem: (item) => `name:${quoteFilterString(item.name)}`,
};

const freeformFilters: FilterDefinition[] = [
  nameFilter,
  {
    keywords: 'notes',
    description: tl('Filter.Notes'),
    format: 'freeform',
    suggestionsGenerator: ({ allNotesHashtags }) => allNotesHashtags,
    filter: ({ filterValue, itemInfos, itemHashTags, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => {
        const notes = getNotes(item, itemInfos, itemHashTags);
        return Boolean(notes && plainString(notes, language).includes(filterValue));
      };
    },
  },
  {
    keywords: 'description',
    description: tl('Filter.PartialMatch'),
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
    filter: ({ filterValue, language }) => {
      const startWord = startWordRegexp(filterValue, language);
      return (item) => {
        // TODO: this definitely does too many array allocations to be performant
        const strings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
          ...getStringsFromDisplayPropertiesMap(item.perks?.map((p) => p.displayProperties)),
          ...getStringsFromAllSockets(item),
        ];
        return strings.some((s) => startWord.test(plainString(s, language)));
      };
    },
  },
  {
    keywords: 'perkname',
    description: tl('Filter.PerkName'),
    format: 'freeform',
    suggestionsGenerator: ({ d2Manifest, allItems }) => {
      if (d2Manifest && allItems) {
        const myPerks = allItems
          .filter((i) => i.bucket.inWeapons || i.bucket.inArmor || i.bucket.inGeneral)
          .flatMap((i) => i.sockets?.allSockets.filter((s) => s.plugged && s.isPerk) ?? []);
        const myPerkNames = myPerks.map((s) => s.plugged!.plugDef.displayProperties.name);
        const allPerkNames = getPerkNamesFromManifest(
          Object.values(d2Manifest.InventoryItem.getAll())
        );
        // favor items we actually own
        return _.uniq([...myPerkNames, ...allPerkNames]).map(
          (s) => `perkname:${quoteFilterString(s.toLowerCase())}`
        );
      }
    },
    filter: ({ filterValue, language }) => {
      const startWord = startWordRegexp(filterValue, language);
      return (item) => {
        // TODO: this may do too many array allocations to be performant.
        const strings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes, false),
          ...getStringsFromAllSockets(item, false),
        ];
        return strings.some((s) => startWord.test(plainString(s, language)));
      };
    },
  },
  {
    keywords: 'keyword',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, itemInfos, itemHashTags, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => {
        const notes = getNotes(item, itemInfos, itemHashTags);
        if (
          (notes && plainString(notes, language).includes(filterValue)) ||
          plainString(item.name, language).includes(filterValue) ||
          plainString(item.description, language).includes(filterValue) ||
          plainString(item.typeName, language).includes(filterValue)
        ) {
          return true;
        }
        const perkStrings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
          ...getStringsFromDisplayPropertiesMap(item.perks?.map((p) => p.displayProperties)),
          ...getStringsFromAllSockets(item),
        ];
        return perkStrings.some((s) => plainString(s, language).includes(filterValue));
      };
    },
  },
];

export default freeformFilters;

/**
 * feed in an object with a `name` and a `description` property,
 * to get an array of just those strings
 */
function getStringsFromDisplayProperties<T extends { name: string; description: string }>(
  displayProperties?: T,
  includeDescription = true
) {
  if (!displayProperties) {
    return [];
  }
  return [displayProperties.name, includeDescription && displayProperties.description].filter(
    Boolean
  ) as string[];
}

/**
 * feed in an object or objects with a `name` and a `description` property,
 * to get an array of just those strings
 */
function getStringsFromDisplayPropertiesMap<T extends { name: string; description: string }>(
  displayProperties?: T | T[] | null,
  includeDescription = true
) {
  if (!displayProperties) {
    return [];
  }
  if (!Array.isArray(displayProperties)) {
    displayProperties = [displayProperties];
  }
  return displayProperties.flatMap((d) => getStringsFromDisplayProperties(d, includeDescription));
}

/** includes name and description unless you set the arg2 flag */
export function getStringsFromAllSockets(item: DimItem, includeDescription = true) {
  return (
    item.sockets?.allSockets.flatMap((socket) => {
      const plugAndPerkDisplay = socket.plugOptions.map((plug) => [
        plug.plugDef.displayProperties,
        plug.perks.map((perk) => perk.displayProperties),
      ]);
      return getStringsFromDisplayPropertiesMap(plugAndPerkDisplay.flat(2), includeDescription);
    }) || []
  );
}

// we can't properly quote a search string if it contains both ' and ", so.. we use this
// to filter them out. small caveat there for the future "WHY DOESN'T THIS WORK" user
export function isQuotable(s: string) {
  return !(s.includes(`'`) && s.includes(`"`));
}

export function quoteFilterString(s: string) {
  return s.includes(`"`) ? `'${s}'` : `"${s}"`;
}
