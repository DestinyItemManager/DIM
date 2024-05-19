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

function subclassDefFromLoadout(loadout: Loadout, d2Definitions: D2ManifestDefinitions) {
  for (const item of loadout.items) {
    const itemDef = d2Definitions?.InventoryItem.get(item.hash);
    if (itemDef?.itemType === DestinyItemType.Subclass) {
      return itemDef;
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
        Array.from(new Set(loadouts.map((l) => subclassDefFromLoadout(l, d2Definitions)))),
      ).map(
        (subclass) =>
          // TODO (ryan) subclasses have a none damage type, so to do subclass match
          // based on element name (solar/stasis/etc) we need to set up some known data
          `subclass:${quoteFilterString(subclass.displayProperties.name.toLowerCase())}`,
      );
    },
    filter: ({ filterValue, language, d2Definitions }) => {
      const test = matchText(filterValue, language, false);
      return (loadout: Loadout) => {
        const subclass = d2Definitions && subclassDefFromLoadout(loadout, d2Definitions);
        return subclass ? test(subclass.displayProperties.name) : false;
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
