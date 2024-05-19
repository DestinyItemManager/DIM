import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { matchText, plainString } from 'app/search/search-filters/freeform';
import { DestinyItemType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { FilterDefinition } from '../../filter-types';
import { quoteFilterString } from '../../query-parser';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';
import { subclassHashToElementNames } from './known-values';

function deduplicate<T>(someArray: (T | undefined | null)[]) {
  return Array.from(new Set(someArray));
}

function subclassDefAndClassTypeFromLoadout(
  loadout: Loadout,
  d2Definitions: D2ManifestDefinitions,
) {
  for (const item of loadout.items) {
    const itemDef = d2Definitions?.InventoryItem.get(item.hash);
    if (itemDef?.itemType === DestinyItemType.Subclass) {
      return { itemDef, classType: loadout.classType };
    }
  }
}

const freeformFilters: FilterDefinition<
  Loadout,
  LoadoutFilterContext,
  LoadoutSuggestionsContext
>[] = [
  {
    keywords: ['name', 'exactname'],
    description: tl('LoadoutFilter.Name'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts }) =>
      loadouts?.map((loadout) => `exactname:${quoteFilterString(loadout.name.toLowerCase())}`),
    filter: ({ filterValue, language, lhs }) => {
      const test = matchText(filterValue, language, /* exact */ lhs === 'exactname');
      return (loadout) => test(loadout.name);
    },
  },
  {
    keywords: ['subclass'],
    description: tl('LoadoutFilter.Subclass'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts, d2Definitions }) => {
      if (!loadouts || !d2Definitions) {
        return [];
      }
      // TODO (ryan) filter on currently selected loadout. This info is currently localized
      // to the page, so we need to lift that up before it can be done.
      return _.compact(
        deduplicate(
          loadouts
            .map((l) => subclassDefAndClassTypeFromLoadout(l, d2Definitions))
            .flatMap((subclass) => {
              if (!subclass) {
                return;
              }
              const subclassElementName =
                subclassHashToElementNames[subclass.classType]?.[subclass.itemDef.hash];
              return [
                `subclass:${quoteFilterString(subclass.itemDef.displayProperties.name.toLowerCase())}`,
                subclassElementName && `subclass:${quoteFilterString(subclassElementName)}`,
              ];
            }),
        ),
      );
    },
    filter: ({ filterValue, language, d2Definitions }) => {
      const test = matchText(filterValue, language, false);
      return (loadout: Loadout) => {
        const subclass =
          d2Definitions && subclassDefAndClassTypeFromLoadout(loadout, d2Definitions);
        const subclassElementName =
          subclass && subclassHashToElementNames[subclass.classType]?.[subclass.itemDef.hash];
        return (
          (subclass && test(subclass.itemDef.displayProperties.name)) ||
          (subclassElementName && test(subclassElementName)) ||
          false
        );
      };
    },
  },
  {
    keywords: 'notes',
    description: tl('LoadoutFilter.Notes'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (loadout) =>
        Boolean(loadout.notes && plainString(loadout.notes, language).includes(filterValue));
    },
  },
  {
    keywords: 'keyword',
    description: tl('LoadoutFilter.PartialMatch'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts }) =>
      loadouts
        ? Array.from(
            new Set([
              ...loadouts.flatMap((loadout) => [
                ...getHashtagsFromNote(loadout.name),
                ...getHashtagsFromNote(loadout.notes),
              ]),
            ]),
          )
        : [],
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      const test = (s: string) => plainString(s, language).includes(filterValue);
      return (loadout) => test(loadout.name) || Boolean(loadout.notes && test(loadout.notes));
    },
  },
];

export default freeformFilters;
