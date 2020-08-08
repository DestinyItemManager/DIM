import { DimItem } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';
import { getNotes, ItemInfos } from 'app/inventory/dim-item-info';
import { settingsSelector } from 'app/settings/reducer';
import store from '../../store/store';
import latinise from 'voca/latinise';

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

const itemInfos: ItemInfos = {};

const freeformFilters: FilterDefinition[] = [
  {
    keywords: ['notes'],
    description: ['Filter.Notes'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: plainString,
    filterFunction: (item: DimItem, filterValue: string) => {
      const notes = getNotes(item, itemInfos) ?? '';
      return plainString(notes).includes(filterValue);
    },
  },
  {
    keywords: ['name'],
    description: ['Filter.PartialMatch'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: plainString,
    filterFunction: (item: DimItem, filterValue: string) =>
      plainString(item.name).includes(filterValue),
  },
  {
    keywords: ['description'],
    description: ['Filter.PartialMatch'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: plainString,
    filterFunction: (item: DimItem, filterValue: string) =>
      plainString(item.description).includes(filterValue),
  },
  {
    keywords: ['perk'],
    description: ['Filter.PartialMatch'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: (filterValue: string) => startWordRegexp(filterValue),
    filterFunction: (item: DimItem, filterValue: RegExp) => {
      const strings = [
        ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes),
        ...getStringsFromAllSockets(item),
      ];
      return strings.some((s) => filterValue.test(s));
    },
  },
  {
    keywords: ['perkname'],
    description: ['Filter.PartialMatch'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: (filterValue: string) => startWordRegexp(filterValue),
    filterFunction: (item: DimItem, filterValue: RegExp) => {
      const strings = [
        ...getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes, false),
        ...getStringsFromAllSockets(item, false),
      ];
      return strings.some((s) => filterValue.test(s));
    },
  },
  {
    keywords: ['keyword'],
    description: ['Filter.PartialMatch'],
    format: 'freeform',
    destinyVersion: 0,
    filterValuePreprocessor: plainString,
    filterFunction: (item: DimItem, filterValue: string) => {
      const notes = getNotes(item, itemInfos) ?? '';
      if (
        plainString(notes).includes(filterValue) ||
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
  return displayProperties
    .map((d) => getStringsFromDisplayProperties(d, includeDescription))
    .flat();
}

/** includes name and description unless you set the arg2 flag */
export function getStringsFromAllSockets(item: DimItem, includeDescription = true) {
  return (
    (item.isDestiny2() &&
      item.sockets &&
      item.sockets.sockets
        .map((socket) => {
          const plugAndPerkDisplay = socket.plugOptions.map((plug) => [
            plug.plugItem.displayProperties,
            plug.perks.map((perk) => perk.displayProperties),
          ]);
          return getStringsFromDisplayPropertiesMap(plugAndPerkDisplay.flat(2), includeDescription);
        })
        .flat()) ||
    []
  );
}
/** includes name and description unless you set the arg2 flag */
export function getStringsFromTalentGrid(item: DimItem, includeDescription = true) {
  return getStringsFromDisplayPropertiesMap(item.talentGrid?.nodes, includeDescription);
}
