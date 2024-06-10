import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { findItemForLoadout, getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { powerLevelByKeyword } from 'app/search/power-levels';
import { matchText, plainString } from 'app/search/text-utils';
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

// Helper object to tell us useful things about all the DIM items we get back from a loadout
// Primarily we are interested in items that contribute to the power level
class ResolvedEquipment {
  // properties
  readonly kinetic: DimItem[];
  readonly energy: DimItem[];
  readonly power: DimItem[];
  readonly helmet: DimItem[];
  readonly gauntlet: DimItem[];
  readonly chest: DimItem[];
  readonly leg: DimItem[];
  readonly class: DimItem[];

  // Grab total counts
  weaponCount(): Number {
    return this.kinetic.length + this.energy.length + this.power.length;
  }
  armorCount(): Number {
    return (
      this.helmet.length +
      this.gauntlet.length +
      this.chest.length +
      this.leg.length +
      this.class.length
    );
  }

  // Convenience checks
  hasAllWeapons(): Boolean {
    return this.kinetic.length > 0 && this.energy.length > 0 && this.power.length > 0;
  }

  hasAllArmor(): Boolean {
    return (
      this.helmet.length > 0 &&
      this.gauntlet.length > 0 &&
      this.chest.length > 0 &&
      this.leg.length > 0 &&
      this.class.length > 0
    );
  }

  // Convenience get specific types
  allWeapons(): DimItem[] {
    return [this.kinetic, this.energy, this.power].flat();
  }
  allArmor(): DimItem[] {
    return [this.chest, this.gauntlet, this.chest, this.leg, this.class].flat();
  }
  allItems(): DimItem[] {
    return [
      this.kinetic,
      this.energy,
      this.power,
      this.chest,
      this.gauntlet,
      this.chest,
      this.leg,
      this.class,
    ].flat();
  }

  constructor(items: DimItem[]) {
    this.kinetic = items.filter((item) => item.bucket.hash === BucketHashes.KineticWeapons);
    this.energy = items.filter((item) => item.bucket.hash === BucketHashes.EnergyWeapons);
    this.power = items.filter((item) => item.bucket.hash === BucketHashes.PowerWeapons);
    this.helmet = items.filter((item) => item.bucket.hash === BucketHashes.Helmet);
    this.gauntlet = items.filter((item) => item.bucket.hash === BucketHashes.Gauntlets);
    this.chest = items.filter((item) => item.bucket.hash === BucketHashes.ChestArmor);
    this.leg = items.filter((item) => item.bucket.hash === BucketHashes.LegArmor);
    this.class = items.filter((item) => item.bucket.hash === BucketHashes.ClassArmor);
  }
}

function ResolveLoadoutToDimItems(
  loadout: Loadout,
  d2Definitions: D2ManifestDefinitions,
  allItems: DimItem[],
  store: DimStore,
): ResolvedEquipment {
  const dimItems: DimItem[] = [];

  // We have two big requirements here:
  // 1. items must be weapons or armor
  // 2. items must be able to be equipped by the character
  // This may not be sufficient, but for the moment it seems good enough
  for (const loadoutItem of loadout.items) {
    const newItem = findItemForLoadout(d2Definitions, allItems, store.id, loadoutItem);
    if (
      newItem &&
      (newItem.bucket.inWeapons || newItem.bucket.inArmor) &&
      itemCanBeEquippedByStoreId(newItem, store.id, loadout.classType, true)
    ) {
      dimItems.push(newItem);
    }
  }
  // Resolve this into an object that tells us what we need to know
  return new ResolvedEquipment(dimItems);
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
        //
        const resolvedLoadout = ResolveLoadoutToDimItems(
          loadout,
          d2Definitions,
          allItems,
          selectedLoadoutsStore,
        );

        // The UI, at the time of implementing this, only shows the light level using the following rules:
        // 1. it only shows the light level if all armor + weapon slots have items assigned
        // 2. it uses all weapons when calculating it (not just equipped)
        // 3. it doesn't take the artifact level into account
        // Here we mimic these restrictions.

        // Enforce restriction #1
        if (!resolvedLoadout.hasAllArmor() || !resolvedLoadout.hasAllWeapons()) {
          return false;
        }

        // Calculate light level of *all* items
        const lightLevel = Math.floor(getLight(selectedLoadoutsStore, resolvedLoadout.allItems()));
        return Boolean(compare!(lightLevel));
      };
    },
  },
  {
    keywords: ['armorlight', 'armorpower'],
    /* t('Filter.PowerKeywords') */
    description: tl('LoadoutFilter.ArmorLight'),
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
        //
        const resolvedLoadout = ResolveLoadoutToDimItems(
          loadout,
          d2Definitions,
          allItems,
          selectedLoadoutsStore,
        );

        // Only show use the light level of the armor
        if (!resolvedLoadout.hasAllArmor()) {
          return false;
        }

        // Calculate light level of *all* weapon
        const lightLevel = Math.floor(getLight(selectedLoadoutsStore, resolvedLoadout.allArmor()));
        return Boolean(compare!(lightLevel));
      };
    },
  },
  {
    keywords: ['weaponlight', 'weaponpower'],
    /* t('Filter.PowerKeywords') */
    description: tl('LoadoutFilter.WeaponLight'),
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
        //
        const resolvedLoadout = ResolveLoadoutToDimItems(
          loadout,
          d2Definitions,
          allItems,
          selectedLoadoutsStore,
        );

        // Only show use the light level of the weapons
        if (!resolvedLoadout.hasAllWeapons()) {
          return false;
        }

        // Calculate light level of *all* weapons
        const lightLevel = Math.floor(
          getLight(selectedLoadoutsStore, resolvedLoadout.allWeapons()),
        );
        return Boolean(compare!(lightLevel));
      };
    },
  },
];

export default freeformFilters;
