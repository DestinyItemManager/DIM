import { tl } from 'app/i18next-t';
import { getNotes } from 'app/inventory/dim-item-info';
import memoizeOne from 'memoize-one';
import latinise from 'voca/latinise';
import { FilterDefinition } from '../filter-types';

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = memoizeOne((language: string) =>
  ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
);

/** escape special characters for a regex */
export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Make a Regexp that searches starting at a word boundary */
function startWordRegexp(s: string, language: string) {
  // Only some languages effectively use the \b regex word boundary
  return new RegExp(`${isLatinBased(language) ? '\\b' : ''}${escapeRegExp(s)}`, 'i');
}

/** returns input string toLower, and stripped of accents if it's a latin language */
const plainString = (s: string, language: string): string =>
  (isLatinBased(language) ? latinise(s) : s).toLowerCase();

const freeformFilters: FilterDefinition[] = [
  {
    keywords: 'notes',
    description: tl('Filter.Notes'),
    format: 'freeform',
    filter: ({ filterValue, itemInfos, itemHashTags, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => {
        const notes = getNotes(item, itemInfos, itemHashTags);
        return Boolean(notes && plainString(notes, language).includes(filterValue));
      };
    },
  },
  {
    keywords: 'name',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => plainString(item.name, language).includes(filterValue);
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
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      const startWord = startWordRegexp(filterValue, language);
      return (item) => {
        // TODO: this may do too many array allocations to be performant.
        const strings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
          ...getStringsFromAllSockets(item),
        ];
        return strings.some((s) => startWord.test(plainString(s, language)));
      };
    },
  },
  {
    keywords: 'perkname',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
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
  displayProperties?: T | T[],
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
export function getStringsFromAllSockets(item, includeDescription = true) {
  return (
    (item.isDestiny2() &&
      item.sockets &&
      item.sockets.allSockets.flatMap((socket) => {
        const plugAndPerkDisplay = socket.plugOptions.map((plug) => [
          plug.plugDef.displayProperties,
          plug.perks.map((perk) => perk.displayProperties),
        ]);
        return getStringsFromDisplayPropertiesMap(plugAndPerkDisplay.flat(2), includeDescription);
      })) ||
    []
  );
}
/** includes name and description unless you set the arg2 flag */
export function getStringsFromTalentGrid(item, includeDescription = true) {
  return getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes, includeDescription);
}
