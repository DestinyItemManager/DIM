import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { getDamageTypeForSubclassDef } from 'app/inventory/subclass';
import { getResolutionInfo } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { matchText, plainString } from 'app/search/text-utils';
import { getDamageDefsByDamageType } from 'app/utils/definitions';
import { isClassCompatible } from 'app/utils/item-utils';
import { DestinyItemType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { FilterDefinition } from '../../filter-types';
import { quoteFilterString } from '../../query-parser';
import { LoadoutFilterContext, LoadoutSuggestionsContext } from '../loadout-filter-types';

function deduplicate<T>(someArray: (T | undefined | null)[]) {
  return _.compact(Array.from(new Set(someArray)));
}

function subclassDefFromLoadout(loadout: Loadout, d2Definitions: D2ManifestDefinitions) {
  for (const item of loadout.items) {
    const resolutionInfo = getResolutionInfo(d2Definitions, item.hash);
    const itemDef = resolutionInfo && d2Definitions?.InventoryItem.getOptional(resolutionInfo.hash);
    if (itemDef?.itemType === DestinyItemType.Subclass) {
      return itemDef;
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
    suggestionsGenerator: ({ loadouts, d2Definitions, selectedLoadoutsStore }) => {
      if (!loadouts || !d2Definitions) {
        return [];
      }
      const damageDefs = getDamageDefsByDamageType(d2Definitions);
      // TODO (ryan) filter on currently selected character. This info is currently localized
      // to the page, so we need to lift that up before it can be done.
      return deduplicate(
        loadouts.flatMap((loadout) => {
          const subclass = subclassDefFromLoadout(loadout, d2Definitions);
          if (!subclass || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
            return;
          }
          const damageType = getDamageTypeForSubclassDef(subclass)!;
          // DamageType.None is 0
          const damageName = damageDefs[damageType].displayProperties.name;
          return [
            `subclass:${quoteFilterString(subclass.displayProperties.name.toLowerCase())}`,
            `subclass:${quoteFilterString(damageName.toLowerCase())}`,
          ];
        }),
      );
    },
    filter: ({ filterValue, language, d2Definitions, selectedLoadoutsStore }) => {
      const test = matchText(filterValue, language, false);
      const damageDefs = d2Definitions && getDamageDefsByDamageType(d2Definitions);
      return (loadout: Loadout) => {
        const subclass = d2Definitions && subclassDefFromLoadout(loadout, d2Definitions);
        if (!subclass || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }
        if (test(subclass.displayProperties.name)) {
          return true;
        }
        // DamageType.None is 0
        const damageType = getDamageTypeForSubclassDef(subclass)!;
        const damageName = damageDefs?.[damageType]?.displayProperties.name;
        return damageName !== undefined && test(damageName);
      };
    },
  },
  {
    keywords: 'contains',
    description: tl('LoadoutFilter.Contains'),
    format: 'freeform',
    suggestionsGenerator: ({ d2Definitions, loadouts, selectedLoadoutsStore }) => {
      if (!d2Definitions || !loadouts) {
        return [];
      }

      return loadouts.flatMap((loadout) => {
        if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return [];
        }

        const itemSuggestions = loadout.items.map((item) => {
          const resolutionInfo = getResolutionInfo(d2Definitions, item.hash);
          const definition =
            resolutionInfo && d2Definitions.InventoryItem.getOptional(resolutionInfo.hash);
          return (
            definition &&
            `contains:${quoteFilterString(definition.displayProperties.name.toLowerCase())}`
          );
        });
        const modSuggestions =
          loadout.parameters?.mods?.map((modHash) => {
            const resolutionInfo = getResolutionInfo(d2Definitions, modHash);
            const definition =
              resolutionInfo && d2Definitions.InventoryItem.getOptional(resolutionInfo.hash);
            return (
              definition &&
              `contains:${quoteFilterString(definition.displayProperties.name.toLowerCase())}`
            );
          }) || [];

        return deduplicate([...itemSuggestions, ...modSuggestions]);
      });
    },
    filter: ({ filterValue, language, d2Definitions, selectedLoadoutsStore }) => {
      const test = matchText(filterValue, language, false);
      return (loadout) => {
        if (!d2Definitions || !isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }

        return (
          loadout.items.some((item) => {
            const resolutionInfo = getResolutionInfo(d2Definitions, item.hash);
            const itemDefinition =
              resolutionInfo && d2Definitions.InventoryItem.getOptional(resolutionInfo.hash);
            return itemDefinition && test(itemDefinition.displayProperties.name);
          }) ||
          loadout.parameters?.mods?.some((mod) => {
            const resolutionInfo = getResolutionInfo(d2Definitions, mod);
            const modDefinition =
              resolutionInfo && d2Definitions.InventoryItem.getOptional(resolutionInfo.hash);
            return modDefinition && test(modDefinition.displayProperties.name);
          })
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
