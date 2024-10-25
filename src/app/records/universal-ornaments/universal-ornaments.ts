import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { ARMOR_NODE, DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { filterMap, mapValues } from 'app/utils/collections';
import { DestinyClass, DestinyCollectibleDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import auxOrnamentSets from 'data/d2/universal-ornament-aux-sets.json';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import { createCollectibleFinder } from '../collectible-matching';

export interface OrnamentsSet<T = number> {
  /** Name of the ornament set */
  name: string;
  key: string;
  /** The set, in bucket order */
  ornaments: T[];
}

/**
 * Ornament sets by class type.
 */
export interface OrnamentsData<T = number> {
  [classType: number]: {
    classType: DestinyClass;
    /** Name of the class for convenience */
    name: string;
    /** Class icon */
    icon: string;
    /** All ornament sets for this class. */
    sets: { [setKey: string]: OrnamentsSet<T> };
  };
}

export interface OrnamentStatus {
  /** Ornaments that are visible in the in-game ornament socket. If they're not already unlocked, they're available for unlocking. */
  visibleOrnaments: Set<number>;
  /** Ornaments that are available for the in-game ornament socket. These are unlocked and can be equipped. */
  unlockedOrnaments: Set<number>;
}

/** Retrieve info from the profile about which ornaments are unlocked, and which ones are visible. */
export const univeralOrnamentsVisibilitySelector = createSelector(
  profileResponseSelector,
  (profileResponse) => {
    const unlockedPlugs: OrnamentStatus = {
      visibleOrnaments: new Set(),
      unlockedOrnaments: new Set(),
    };
    if (profileResponse?.profilePlugSets.data?.plugs) {
      for (const plugSetHash of universalOrnamentPlugSetHashes) {
        const plugs = profileResponse.profilePlugSets.data.plugs[plugSetHash];
        if (!plugs) {
          continue;
        }
        for (const plugSetItem of plugs) {
          if (plugSetItem.canInsert) {
            unlockedPlugs.visibleOrnaments.add(plugSetItem.plugItemHash);
            unlockedPlugs.unlockedOrnaments.add(plugSetItem.plugItemHash);
          } else if (plugSetItem.enabled) {
            unlockedPlugs.visibleOrnaments.add(plugSetItem.plugItemHash);
          }
        }
      }
    }

    for (const characterId in profileResponse?.characterPlugSets.data) {
      for (const plugSetHash of universalOrnamentPlugSetHashes) {
        const plugs = profileResponse?.characterPlugSets.data[characterId].plugs[plugSetHash];
        if (!plugs) {
          continue;
        }
        for (const plugSetItem of plugs) {
          if (plugSetItem.canInsert) {
            unlockedPlugs.visibleOrnaments.add(plugSetItem.plugItemHash);
            unlockedPlugs.unlockedOrnaments.add(plugSetItem.plugItemHash);
          } else if (plugSetItem.enabled) {
            unlockedPlugs.visibleOrnaments.add(plugSetItem.plugItemHash);
          }
        }
      }
    }
    return unlockedPlugs;
  },
);

/**
 * Returns universal ornament plug set hashes keyed by class and sorted in inventory slot order
 * (helmet -> class item)
 */
function identifyPlugSets(defs: D2ManifestDefinitions): { [classType: number]: number[] } {
  const sets: { [classType: number]: { [bucketTypeHash: number]: number } } = {
    [DestinyClass.Titan]: {},
    [DestinyClass.Hunter]: {},
    [DestinyClass.Warlock]: {},
  };
  nextPlugSet: for (const plugSetHash of universalOrnamentPlugSetHashes) {
    const plugSet = defs.PlugSet.get(plugSetHash);
    for (const entry of plugSet.reusablePlugItems) {
      const item = defs.InventoryItem.get(entry.plugItemHash);
      if (
        !item.redacted &&
        item.collectibleHash &&
        item.inventory &&
        D2Categories.Armor.includes(item.inventory.bucketTypeHash) &&
        item.classType !== DestinyClass.Unknown
      ) {
        sets[item.classType][item.inventory.bucketTypeHash] = plugSetHash;
        continue nextPlugSet;
      }
    }
  }
  return mapValues(sets, (set) => D2Categories.Armor.map((bucketHash) => set[bucketHash]));
}

/**
 * Builds universal ornament sets based entirely on static definition data. This takes
 * all universal ornament plugs and applies a bunch of heuristics to map them to armor sets
 * using presentation node / collectible defs.
 */
export const buildSets = memoizeOne((defs: D2ManifestDefinitions): OrnamentsData => {
  const plugSetHashes = identifyPlugSets(defs);
  const collectibleFinder = createCollectibleFinder(defs);
  const data: OrnamentsData = {
    [DestinyClass.Titan]: { classType: DestinyClass.Titan, sets: {}, name: '', icon: '' },
    [DestinyClass.Hunter]: { classType: DestinyClass.Hunter, sets: {}, name: '', icon: '' },
    [DestinyClass.Warlock]: { classType: DestinyClass.Warlock, sets: {}, name: '', icon: '' },
  };

  const findCollectibleArmorParentNode = (
    collectible: DestinyCollectibleDefinition | undefined,
  ) => {
    if (collectible) {
      return collectible.parentNodeHashes
        ?.map((nodeHash) => defs.PresentationNode.get(nodeHash))
        .find((node) => node?.children.collectibles?.length <= 5);
    }
  };

  // The Titan / Hunter / Warlock presentation nodes as children of the Armor node. NB hardcoded order here...
  const classPresentationNodes = defs.PresentationNode.get(ARMOR_NODE).children.presentationNodes;
  for (const classType of [
    DestinyClass.Titan,
    DestinyClass.Hunter,
    DestinyClass.Warlock,
  ] as const) {
    const relevantPlugSetHashes = plugSetHashes[classType];
    const classNode = classPresentationNodes[classType];
    const classNodeDef = defs.PresentationNode.get(classNode.presentationNodeHash);
    data[classType].name = classNodeDef.displayProperties.name;
    data[classType].icon = classNodeDef.displayProperties.icon;
    const auxSets = Object.entries(auxOrnamentSets[classType]);

    const otherItems: number[] = [];

    for (const plugSetHash of relevantPlugSetHashes) {
      const plugSet = defs.PlugSet.get(plugSetHash);
      if (!plugSet) {
        continue;
      }
      for (const entry of plugSet.reusablePlugItems) {
        if (DEFAULT_ORNAMENTS.includes(entry.plugItemHash)) {
          continue;
        }
        const item = defs.InventoryItem.get(entry.plugItemHash);
        if (item) {
          // d2ai may have categorized this into its own armor set.
          // Add it using the d2ai-generated set key.
          const auxEntry = auxSets.find(([, set]) => set.some((hash) => hash === item.hash));
          if (auxEntry) {
            const [key] = auxEntry;
            (data[classType].sets[key] ??= {
              key,
              name: '',
              ornaments: [],
            }).ornaments.push(item.hash);
            if (item.inventory?.bucketTypeHash === BucketHashes.ClassArmor) {
              // And use the class item as the set name as Bungie used this workaround
              // too for the 2023 Solstice sets
              data[classType].sets[key].name = item.displayProperties.name;
            }
          } else {
            const node = findCollectibleArmorParentNode(collectibleFinder(item, classType));
            if (node) {
              // Some sets will be mapped to the same presentation node - find things that are categorically different
              // 1. whether the plug is a proper armor piece too, or just a modification
              // 2. season (via iconWatermark)
              // 3. whether the item has a collectibleHash
              const setKey = `${node.hash}-${
                item.inventory?.bucketTypeHash === BucketHashes.Modifications
              }-${item.iconWatermark}-${Boolean(item.collectibleHash)}`;
              (data[classType].sets[setKey] ??= {
                key: setKey,
                name: node.displayProperties.name,
                ornaments: [],
              }).ornaments.push(item.hash);
            } else {
              otherItems.push(item.hash);
            }
          }
        }
      }
    }

    // Finally, put all remaining items (as of writing, Masquerader's helmet and two class items per class)
    // into their own section.
    data[classType].sets[-123] = {
      name: t('Records.UniversalOrnamentSetOther'),
      key: '-123',
      ornaments: otherItems,
    };
  }

  return data;
});

/**
 * Turn our def-based ornament hashes into DimItems based on live data.
 */
export function instantiateOrnamentSets(
  data: OrnamentsData,
  itemCreationContext: ItemCreationContext,
): OrnamentsData<DimItem> {
  return mapValues(data, (classData) => ({
    ...classData,
    sets: Object.fromEntries(
      filterMap(Object.entries(classData.sets), ([key, set]) => {
        const items = filterMap(set.ornaments, (hash) => makeFakeItem(itemCreationContext, hash));
        return [key, { ...set, ornaments: items }];
      }),
    ),
  }));
}

/**
 * Filter ornaments down to sets matching the search filter.
 */
export function filterOrnamentSets(
  data: Readonly<OrnamentsData<DimItem>>,
  searchQuery: string,
  searchFilter: ItemFilter,
): OrnamentsData<DimItem> {
  return mapValues(data, (classData) => ({
    ...classData,
    sets: Object.fromEntries(
      Object.entries(classData.sets).filter(
        ([_key, set]) =>
          !searchQuery ||
          set.name.toLowerCase().includes(searchQuery) ||
          set.ornaments.some(searchFilter),
      ),
    ),
  }));
}
