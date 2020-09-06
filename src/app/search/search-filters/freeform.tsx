import { tl } from 'app/i18next-t';
import { getNotes } from 'app/inventory/dim-item-info';
import { settingsSelector } from 'app/settings/reducer';
import latinise from 'voca/latinise';
import store from '../../store/store';
import { FilterDefinition } from '../filter-types';

/** global language bool. "latin" character sets are the main driver of string processing changes */
const isLatinBased = (() =>
  ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(
    settingsSelector(store.getState()).language
  ))();

/** escape special characters for a regex */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Make a Regexp that searches starting at a word boundary */
function startWordRegexp(s: string) {
  // Only some languages effectively use the \b regex word boundary
  return new RegExp(`${isLatinBased ? '\\b' : ''}${escapeRegExp(s)}`, 'i');
}

/** returns input string toLower, and stripped of accents if it's a latin language */
const plainString = (s: string): string => (isLatinBased ? latinise(s) : s).toLowerCase();

const freeformFilters: FilterDefinition[] = [
  {
    keywords: 'notes',
    description: tl('Filter.Notes'),
    format: 'freeform',
    filterFunction: ({ filterValue, itemInfos, itemHashTags }) => {
      filterValue = plainString(filterValue);
      return (item) => {
        const notes = getNotes(item, itemInfos, itemHashTags);
        return Boolean(notes && plainString(notes).includes(filterValue));
      };
    },
  },
  {
    keywords: 'name',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => {
      filterValue = plainString(filterValue);
      return (item) => plainString(item.name).includes(filterValue);
    },
  },
  {
    keywords: 'description',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => {
      filterValue = plainString(filterValue);
      return (item) => plainString(item.description).includes(filterValue);
    },
  },
  {
    keywords: 'perk',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => {
      const startWord = startWordRegexp(filterValue);
      return (item) => {
        // TODO: this may do too many array allocations to be performant.
        const strings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
          ...getStringsFromAllSockets(item),
        ];
        return strings.some((s) => startWord.test(s));
      };
    },
  },
  {
    keywords: 'perkname',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filterFunction: ({ filterValue }) => {
      const startWord = startWordRegexp(filterValue);
      return (item) => {
        // TODO: this may do too many array allocations to be performant.
        const strings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes, false),
          ...getStringsFromAllSockets(item, false),
        ];
        return strings.some((s) => startWord.test(s));
      };
    },
  },
  {
    keywords: 'keyword',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filterFunction: ({ filterValue, itemInfos, itemHashTags }) => {
      filterValue = plainString(filterValue);
      return (item) => {
        const notes = getNotes(item, itemInfos, itemHashTags);
        if (
          (notes && plainString(notes).includes(filterValue)) ||
          plainString(item.name).includes(filterValue) ||
          plainString(item.description).includes(filterValue) ||
          plainString(item.typeName).includes(filterValue)
        ) {
          return true;
        }
        const perkStrings = [
          ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
          ...getStringsFromAllSockets(item),
        ];
        return perkStrings.some((s) => s.includes(filterValue));
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
