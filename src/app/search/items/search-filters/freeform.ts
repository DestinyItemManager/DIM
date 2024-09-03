import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { DimItem, DimPlug } from 'app/inventory/item-types';
import { quoteFilterString } from 'app/search/query-parser';
import {
  matchText,
  plainString,
  startWordRegexp,
  testStringsFromDisplayProperties,
  testStringsFromDisplayPropertiesMap,
} from 'app/search/text-utils';
import { filterMap } from 'app/utils/collections';
import { isD1Item } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition, TierType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import memoizeOne from 'memoize-one';
import { ItemFilterDefinition } from '../item-filter-types';

const interestingPlugTypes = new Set([PlugCategoryHashes.Frames, PlugCategoryHashes.Intrinsics]);
const getPerkNamesFromManifest = memoizeOne(
  (allItems: { [hash: number]: DestinyInventoryItemDefinition }) =>
    filterMap(Object.values(allItems), (item) => {
      const pch = item.plug?.plugCategoryHash;
      return pch && interestingPlugTypes.has(pch)
        ? item.displayProperties.name.toLowerCase() || undefined
        : undefined;
    }),
);

const getUniqueItemNamesFromManifest = memoizeOne(
  (allManifestItems: { [hash: number]: DestinyInventoryItemDefinition }) => {
    const itemNames = Object.values(allManifestItems)
      .filter((i) => {
        if (!i.itemCategoryHashes || !i.displayProperties.name) {
          return false;
        }

        const isArmor = i.itemCategoryHashes.includes(ItemCategoryHashes.Armor);

        // there's annoying white armors named stuff like "Gauntlets" that distract from things like is:gauntlets
        if (isArmor && i.inventory!.tierType === TierType.Basic) {
          return false;
        }

        return isArmor || i.itemCategoryHashes.includes(ItemCategoryHashes.Weapon);
      })
      .map((i) => i.displayProperties.name.toLowerCase());
    return [...new Set(itemNames)];
  },
);

const nameFilter = {
  keywords: ['name', 'exactname'],
  description: tl('Filter.Name'),
  format: 'freeform',
  suggestionsGenerator: ({ d2Definitions, allItems }) => {
    if (d2Definitions && allItems) {
      const myItemNames = allItems
        .filter(
          (i) =>
            i.bucket.inWeapons || i.bucket.inArmor || i.bucket.inGeneral || i.bucket.inInventory,
        )
        .map((i) => i.name.toLowerCase());
      // favor items we actually own
      const allItemNames = getUniqueItemNamesFromManifest(d2Definitions.InventoryItem.getAll());
      return Array.from(
        new Set([...myItemNames, ...allItemNames]),
        (s) => `exactname:${quoteFilterString(s)}`,
      );
    }
  },
  filter: ({ filterValue, language, lhs }) => {
    const test = matchText(filterValue, language, /* exact */ lhs === 'exactname');
    return (item) => test(item.name);
  },
  fromItem: (item) => `exactname:${quoteFilterString(item.name)}`,
} satisfies ItemFilterDefinition;

const freeformFilters: ItemFilterDefinition[] = [
  nameFilter,
  {
    keywords: 'notes',
    description: tl('Filter.Notes'),
    format: 'freeform',
    suggestionsGenerator: ({ allNotesHashtags }) => allNotesHashtags,
    filter: ({ filterValue, getNotes, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => {
        const notes = getNotes(item);
        return Boolean(notes && plainString(notes, language).includes(filterValue));
      };
    },
  },
  {
    keywords: 'description',
    description: tl('Filter.DescriptionFilter'),
    format: 'freeform',
    filter: ({ filterValue, language }) => {
      filterValue = plainString(filterValue, language);
      return (item) => plainString(item.description, language).includes(filterValue);
    },
  },
  {
    keywords: 'perk',
    description: tl('Filter.Perk'),
    format: 'freeform',
    filter: ({ filterValue, language, d2Definitions }) => {
      const startWord = startWordRegexp(plainString(filterValue, language), language);
      const test = (s: string) => startWord.test(plainString(s, language));
      return (item) =>
        (isD1Item(item) &&
          item.talentGrid &&
          testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes)) ||
        (item.sockets && testStringsFromAllSockets(test, item, d2Definitions));
    },
  },
  {
    keywords: ['perkname', 'exactperk'],
    description: tl('Filter.PerkName'),
    format: 'freeform',
    suggestionsGenerator: ({ d2Definitions, allItems }) => {
      if (d2Definitions && allItems) {
        const perkNames = new Set<string>();
        // favor items we actually own by inserting them first
        for (const item of allItems) {
          if (
            item.sockets &&
            (item.bucket.inWeapons || item.bucket.inArmor || item.bucket.inGeneral)
          ) {
            for (const socket of item.sockets.allSockets) {
              if (socket.isPerk) {
                for (const plug of socket.plugOptions) {
                  perkNames.add(plug.plugDef.displayProperties.name.toLowerCase());
                }
              }
            }
          }
        }

        // supplement the list with perks from definitions, so people can search things they don't own
        for (const perkName of getPerkNamesFromManifest(d2Definitions.InventoryItem.getAll())) {
          perkNames.add(perkName);
        }

        return Array.from(perkNames, (s) => `exactperk:${quoteFilterString(s)}`);
      }
    },
    filter: ({ lhs, filterValue, language, d2Definitions }) => {
      const test = matchText(filterValue, language, /* exact */ lhs === 'exactperk');
      return (item) =>
        (isD1Item(item) &&
          testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes, false)) ||
        testStringsFromAllSockets(test, item, d2Definitions, /* includeDescription */ false);
    },
  },
  {
    keywords: 'keyword',
    description: tl('Filter.PartialMatch'),
    format: 'freeform',
    filter: ({ filterValue, getNotes, language, d2Definitions }) => {
      filterValue = plainString(filterValue, language);
      const test = (s: string) => plainString(s, language).includes(filterValue);
      return (item) => {
        const notes = getNotes(item);
        return (
          (notes && test(notes)) ||
          test(item.name) ||
          test(item.description) ||
          test(item.typeName) ||
          (isD1Item(item) && testStringsFromDisplayPropertiesMap(test, item.talentGrid?.nodes)) ||
          testStringsFromAllSockets(test, item, d2Definitions) ||
          (d2Definitions &&
            (testStringsFromObjectives(test, d2Definitions, item.objectives) ||
              testStringsFromRewards(test, d2Definitions, item.pursuit)))
        );
      };
    },
  },
];

export default freeformFilters;

function testStringsFromObjectives(
  test: (str: string) => boolean,
  defs: D2ManifestDefinitions,
  objectives: DimItem['objectives'],
): boolean {
  return Boolean(
    objectives?.some((o) => test(defs.Objective.get(o.objectiveHash)?.progressDescription ?? '')),
  );
}

function testStringsFromRewards(
  test: (str: string) => boolean,
  defs: D2ManifestDefinitions,
  pursuitInfo: DimItem['pursuit'],
): boolean {
  return Boolean(
    pursuitInfo?.rewards.some((r) =>
      testStringsFromDisplayProperties(test, defs.InventoryItem.get(r.itemHash).displayProperties),
    ),
  );
}

/** includes name and description unless you set the arg2 flag */
function testStringsFromAllSockets(
  test: (str: string) => boolean,
  item: DimItem,
  defs: D2ManifestDefinitions | undefined,
  includeDescription = true,
): boolean {
  if (!item.sockets) {
    return false;
  }
  for (const socket of item.sockets.allSockets) {
    for (const plug of socket.plugOptions) {
      if (
        testStringsFromDisplayPropertiesMap(
          test,
          plug.plugDef.displayProperties,
          includeDescription,
        ) ||
        test(plug.plugDef.itemTypeDisplayName) ||
        (defs &&
          getPlugPerks(plug, defs).some((perk) =>
            testStringsFromDisplayPropertiesMap(test, perk.displayProperties, includeDescription),
          ))
      ) {
        return true;
      }
    }
    // include tooltips from the plugged item
    if (socket.plugged?.plugDef.tooltipNotifications) {
      for (const t of socket.plugged.plugDef.tooltipNotifications) {
        if (test(t.displayString)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getPlugPerks(plug: DimPlug, defs: D2ManifestDefinitions) {
  return (plug.plugDef.perks || []).map((perk) => defs.SandboxPerk.get(perk.perkHash));
}
