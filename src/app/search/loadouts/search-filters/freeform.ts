import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { findItemForLoadout, getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { powerLevelByKeyword } from 'app/search/power-levels';
import { matchText, plainString } from 'app/search/text-utils';
import { filterMap } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { isClassCompatible, itemCanBeEquippedByStoreId } from 'app/utils/item-utils';
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
    const resolvedItem = findItemForLoadout(
      d2Definitions,
      allItems ?? emptyArray(),
      store?.id,
      item,
    );
    if (resolvedItem?.bucket.hash === BucketHashes.Subclass) {
      return resolvedItem;
    }
  }
}

function isLoadoutCompatibleWithStore(loadout: Loadout, store: DimStore | undefined) {
  return !store || isClassCompatible(loadout.classType, store.classType);
}

type EquippedItemBuckets = Record<string, DimItem[]>;

/**  Convenience check for items that contribute to power level */
function equipsAllItemsForPowerLevel(items: EquippedItemBuckets): Boolean {
  return (
    (items[BucketHashes.KineticWeapons]?.length > 0 &&
      items[BucketHashes.EnergyWeapons]?.length > 0 &&
      items[BucketHashes.PowerWeapons]?.length > 0 &&
      items[BucketHashes.Helmet]?.length > 0 &&
      items[BucketHashes.Gauntlets]?.length > 0 &&
      items[BucketHashes.ChestArmor]?.length > 0 &&
      items[BucketHashes.LegArmor]?.length > 0 &&
      items[BucketHashes.ClassArmor]?.length > 0) ??
    false
  );
}

/** Convenience function to get all items that contribute to power level */
function allLoadoutItemsForPowerLevel(items: EquippedItemBuckets): DimItem[] {
  return [
    items[BucketHashes.KineticWeapons],
    items[BucketHashes.EnergyWeapons],
    items[BucketHashes.PowerWeapons],
    items[BucketHashes.Helmet],
    items[BucketHashes.Gauntlets],
    items[BucketHashes.ChestArmor],
    items[BucketHashes.LegArmor],
    items[BucketHashes.ClassArmor],
  ].flat();
}

/**
 * Simplified version of getItemsFromLoadoutItems that doesn't generate warnItems, and only
 * converts equipped armor and weapons that can be equipped.
 */
function getEquippedItemsFromLoadout(
  loadout: Loadout,
  d2Definitions: D2ManifestDefinitions,
  allItems: DimItem[],
  store: DimStore,
): EquippedItemBuckets {
  // We have two big requirements here:
  // 1. items must be weapons or armor
  // 2. items must be able to be equipped by the character
  // This may not be sufficient, but for the moment it seems good enough
  const dimItems = filterMap(loadout.items, (loadoutItem) => {
    if (loadoutItem.equip) {
      const newItem = findItemForLoadout(d2Definitions, allItems, store.id, loadoutItem);
      if (
        newItem &&
        (newItem.bucket.inWeapons || newItem.bucket.inArmor) &&
        itemCanBeEquippedByStoreId(newItem, store.id, loadout.classType, true)
      ) {
        return newItem;
      }
    }
  });
  // Resolve this into an object that tells us what we need to know
  return Object.groupBy(dimItems, (item) => item.bucket.hash);
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

      return deduplicate(
        loadouts.flatMap((loadout) => {
          if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
            return;
          }
          const subclass = subclassFromLoadout(
            loadout,
            d2Definitions,
            allItems,
            selectedLoadoutsStore,
          );
          if (!subclass) {
            return;
          }
          const damageName = subclass.element?.displayProperties.name;
          return [
            `subclass:${quoteFilterString(subclass.name.toLowerCase())}`,
            damageName && `subclass:${quoteFilterString(damageName.toLowerCase())}`,
          ];
        }),
      );
    },
    filter: ({ filterValue, language, allItems, d2Definitions, selectedLoadoutsStore }) => {
      const test = matchText(filterValue, language, false);
      return (loadout: Loadout) => {
        if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }

        const subclass =
          d2Definitions &&
          subclassFromLoadout(loadout, d2Definitions, allItems, selectedLoadoutsStore);
        if (!subclass) {
          return false;
        }
        if (test(subclass.name)) {
          return true;
        }

        const damageName = subclass.element?.displayProperties.name;
        return damageName !== undefined && test(damageName);
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

      return deduplicate(
        loadouts.flatMap((loadout) => {
          if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
            return;
          }

          const itemSuggestions = loadout.items.map((item) => {
            const resolvedItem = findItemForLoadout(
              d2Definitions,
              allItems ?? emptyArray(),
              selectedLoadoutsStore?.id,
              item,
            );
            return (
              resolvedItem && `exactcontains:${quoteFilterString(resolvedItem.name.toLowerCase())}`
            );
          });
          const modSuggestions = getModsFromLoadout(d2Definitions, loadout).map(
            (mod) =>
              `exactcontains:${quoteFilterString(mod.resolvedMod.displayProperties.name.toLowerCase())}`,
          );

          return [...itemSuggestions, ...modSuggestions];
        }),
      );
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
  {
    keywords: ['light', 'power'],
    /* t('Filter.PowerKeywords') */
    description: tl('LoadoutFilter.LoadoutLight'),
    format: 'range',
    overload: powerLevelByKeyword,
    filter: ({ compare, allItems, d2Definitions, selectedLoadoutsStore }) => {
      if (!d2Definitions || !selectedLoadoutsStore || !allItems) {
        return () => false;
      }
      return (loadout: Loadout) => {
        if (!isLoadoutCompatibleWithStore(loadout, selectedLoadoutsStore)) {
          return false;
        }

        // Get the equipped items that contribute to the power level (weapons, armor)
        const equippedItems = getEquippedItemsFromLoadout(
          loadout,
          d2Definitions,
          allItems,
          selectedLoadoutsStore,
        );

        // Require that the loadout has an item in all weapon + armor slots
        if (!equipsAllItemsForPowerLevel(equippedItems)) {
          return false;
        }

        // Calculate light level of items
        const lightLevel = Math.floor(
          getLight(selectedLoadoutsStore, allLoadoutItemsForPowerLevel(equippedItems)),
        );
        return Boolean(compare!(lightLevel));
      };
    },
  },
];

export default freeformFilters;
