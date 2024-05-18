import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { getDamageTypeForSubclassDef } from 'app/inventory/subclass';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { matchText, plainString } from 'app/search/search-filters/freeform';
import { DestinyItemType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { FilterDefinition } from '../../filter-types';
import { quoteFilterString } from '../../query-parser';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

function deduplicate<T>(someArray: (T | undefined | null)[]) {
  return _.compact(Array.from(new Set(someArray)));
}

const damageDefsByDamageType = memoizeOne((defs: D2ManifestDefinitions) =>
  _.keyBy(Object.values(defs.DamageType.getAll()), (d) => d.enumValue),
);

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
      const damageDefs = damageDefsByDamageType(d2Definitions);
      // TODO (ryan) filter on currently selected character. This info is currently localized
      // to the page, so we need to lift that up before it can be done.
      return deduplicate(
        loadouts.flatMap((loadout) => {
          const subclass = subclassDefFromLoadout(loadout, d2Definitions);
          const damageType = subclass ? getDamageTypeForSubclassDef(subclass) : undefined;
          // DamageType.None is 0
          const damageName =
            damageType !== undefined ? damageDefs[damageType]?.displayProperties.name : undefined;
          return [
            subclass
              ? `subclass:${quoteFilterString(subclass.displayProperties.name.toLowerCase())}`
              : undefined,
            damageName ? `subclass:${quoteFilterString(damageName.toLowerCase())}` : undefined,
          ];
        }),
      );
    },
    filter: ({ filterValue, language, d2Definitions }) => {
      const test = matchText(filterValue, language, false);
      const damageDefs = d2Definitions && damageDefsByDamageType(d2Definitions);
      return (loadout: Loadout) => {
        const subclass = d2Definitions ? subclassDefFromLoadout(loadout, d2Definitions) : undefined;
        // DamageType.None is 0
        const damageType = subclass ? getDamageTypeForSubclassDef(subclass) : undefined;
        const damageName =
          damageType !== undefined ? damageDefs?.[damageType]?.displayProperties.name : undefined;
        return (
          (subclass !== undefined && test(subclass.displayProperties.name)) ||
          (damageName !== undefined && test(damageName))
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
