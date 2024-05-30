import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { findItemForLoadout, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { matchText, plainString } from 'app/search/text-utils';
import { getDamageDefsByDamageType } from 'app/utils/definitions';
import { isClassCompatible } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { FilterDefinition } from '../../filter-types';
import { quoteFilterString } from '../../query-parser';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

function deduplicate<T>(someArray: (T | undefined | null)[]) {
  return _.compact(Array.from(new Set(someArray)));
}

function subclassFromLoadout(
  loadout: Loadout,
  d2Definitions: D2ManifestDefinitions,
  allItems: DimItem[] | undefined,
  store: DimStore | undefined,
) {
  for (const item of loadout.items) {
    const resolvedItem = findItemForLoadout(d2Definitions, allItems || [], store?.id, item);
    if (resolvedItem?.bucket.hash === BucketHashes.Subclass) {
      return resolvedItem;
    }
  }
}

function isLoadoutCompatibleWithStore(loadout: Loadout, store: DimStore | undefined) {
  return !store || isClassCompatible(loadout.classType, store.classType);
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
    suggestionsGenerator: ({ loadouts, selectedLoadoutsStore }) =>
      loadouts
        ?.filter((loadout) => isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore))
        .map((loadout) => `exactname:${quoteFilterString(loadout.name.toLowerCase())}`),
    filter: ({ filterValue, language, lhs }) => {
      const test = matchText(filterValue, language, /* exact */ lhs === 'exactname');
      return (loadout) => test(loadout.name);
    },
  },
  {
    keywords: ['subclass'],
    description: tl('LoadoutFilter.Subclass'),
    format: 'freeform',
    suggestionsGenerator: ({ loadouts, allItems, d2Definitions, selectedLoadoutsStore }) => {
      if (!loadouts || !d2Definitions) {
        return [];
      }
      const damageDefs = getDamageDefsByDamageType(d2Definitions);
      // TODO (ryan) filter on currently selected character. This info is currently localized
      // to the page, so we need to lift that up before it can be done.
      return deduplicate(
        loadouts.flatMap((loadout) => {
          const subclass = subclassFromLoadout(
            loadout,
            d2Definitions,
            allItems,
            selectedLoadoutsStore,
          );
          if (!subclass || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
            return;
          }
          const damageType = subclass.element?.enumValue;
          // DamageType.None is 0
          const damageName =
            damageType !== undefined ? damageDefs[damageType].displayProperties.name : undefined;
          return [
            `subclass:${quoteFilterString(subclass.name.toLowerCase())}`,
            damageName && `subclass:${quoteFilterString(damageName.toLowerCase())}`,
          ];
        }),
      );
    },
    filter: ({ filterValue, language, allItems, d2Definitions, selectedLoadoutsStore }) => {
      const test = matchText(filterValue, language, false);
      const damageDefs = d2Definitions && getDamageDefsByDamageType(d2Definitions);
      return (loadout: Loadout) => {
        const subclass =
          d2Definitions &&
          subclassFromLoadout(loadout, d2Definitions, allItems, selectedLoadoutsStore);
        if (!subclass || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }
        if (test(subclass.name)) {
          return true;
        }
        // DamageType.None is 0
        const damageType = subclass.element?.enumValue;
        if (!damageDefs || damageType === undefined) {
          return false;
        }
        const damageName = damageDefs[damageType].displayProperties.name;
        return test(damageName);
      };
    },
  },
  {
    keywords: ['contains', 'exactcontains'],
    description: tl('LoadoutFilter.Contains'),
    format: 'freeform',
    suggestionsGenerator: ({ d2Definitions, allItems, loadouts, selectedLoadoutsStore }) => {
      if (!d2Definitions || !loadouts) {
        return [];
      }

      return loadouts.flatMap((loadout) => {
        if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return [];
        }

        const itemSuggestions = loadout.items.map((item) => {
          const resolvedItem = findItemForLoadout(
            d2Definitions,
            // Will never actually be undefined, due to types used for FilterHelp we need to make
            // allItems undefined in the suggestion types.
            // TODO (ryan) fix this
            allItems || [],
            selectedLoadoutsStore?.id,
            item,
          );
          return (
            resolvedItem && `exactcontains:${quoteFilterString(resolvedItem.name.toLowerCase())}`
          );
        });
        const modSuggestions =
          getModsFromLoadout(d2Definitions, loadout).map(
            (mod) =>
              `exactcontains:${quoteFilterString(mod.resolvedMod.displayProperties.name.toLowerCase())}`,
          ) || [];

        return deduplicate([...itemSuggestions, ...modSuggestions]);
      });
    },
    filter: ({ filterValue, language, allItems, d2Definitions, selectedLoadoutsStore, lhs }) => {
      const test = matchText(filterValue, language, lhs === 'exactcontains');
      return (loadout) => {
        if (!d2Definitions || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }

        return (
          loadout.items.some((item) => {
            const resolvedItem = findItemForLoadout(
              d2Definitions,
              allItems,
              selectedLoadoutsStore?.id,
              item,
            );
            return resolvedItem && test(resolvedItem?.name);
          }) ||
          getModsFromLoadout(d2Definitions, loadout).some((mod) =>
            test(mod.resolvedMod.displayProperties.name),
          )
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
    suggestionsGenerator: ({ loadouts, selectedLoadoutsStore }) =>
      loadouts
        ? Array.from(
            new Set([
              ...loadouts
                .filter((loadout) => isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore))
                .flatMap((loadout) => [
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
