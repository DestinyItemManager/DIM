import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { ARMOR_NODE, DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { filterMap } from 'app/utils/util';
import { DestinyClass, DestinyPresentationNodeDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';

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
    /** All ornament sets for this class. */
    sets: { [setKey: string]: OrnamentsSet<T> };
  };
}

export interface OrnamentStatus {
  /** Ornaments that are visible in the in-game ornament socket. If they're not already unlocked, they're available for unlocking. */
  visibleOrnaments: Set<number>;
  /** Ornaments that are visible in the in-game ornament socket. These are unlocked and can be equipped */
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
  }
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
  return _.mapValues(sets, (set) => D2Categories.Armor.map((bucketHash) => set[bucketHash]));
}

/**
 * Builds universal ornament sets based entirely on static definition data. This takes
 * all universal ornament plugs and applies a bunch of heuristics to map them to armor sets
 * using presentation node / collectible defs.
 */
export const buildSets = memoizeOne((defs: D2ManifestDefinitions): OrnamentsData => {
  const collectPresentationNodes = (
    nodeHash: number,
    list: DestinyPresentationNodeDefinition[]
  ) => {
    const def = defs.PresentationNode.get(nodeHash);
    if (def && !def.redacted) {
      if (def.children.collectibles.length) {
        list.push(def);
      }
      for (const childNode of def.children.presentationNodes) {
        collectPresentationNodes(childNode.presentationNodeHash, list);
      }
    }
    return list;
  };

  const plugSetHashes = identifyPlugSets(defs);
  const data: OrnamentsData = {
    [DestinyClass.Titan]: { classType: DestinyClass.Titan, sets: {}, name: '' },
    [DestinyClass.Hunter]: { classType: DestinyClass.Hunter, sets: {}, name: '' },
    [DestinyClass.Warlock]: { classType: DestinyClass.Warlock, sets: {}, name: '' },
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
    const relevantPresentationNodes = collectPresentationNodes(classNode.presentationNodeHash, []);
    data[classType].name = classNodeDef.displayProperties.name;

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
        if (item && !item.redacted) {
          // If the plugSetItem has a collectible as its collectibleHash,
          // we have a certain match.
          let node = relevantPresentationNodes.find((i) =>
            i.children.collectibles.some(
              (collectible) => collectible.collectibleHash === item.collectibleHash
            )
          );
          if (!node) {
            // Tons of reissued armor sets end up with an ornament set
            // that is different from the set that actually has the collectible entries,
            // so find a collectible that has the same name.
            node = relevantPresentationNodes.find((i) =>
              i.children.collectibles.some((collectible) => {
                const collectibleDef = defs.Collectible.get(collectible.collectibleHash);
                return collectibleDef?.displayProperties.name.startsWith(
                  item.displayProperties.name
                );
              })
            );
          }
          if (!node) {
            // Y1 Trials / Prophecy: Bond Judgment vs. Judgement's Wrap
            // The collectible icon will be different, but reference an item
            // where the icon matches our icon
            node = relevantPresentationNodes.find((i) =>
              i.children.collectibles.some((collectible) => {
                const collectibleDef = defs.Collectible.get(collectible.collectibleHash);
                const reverseItemDef =
                  collectibleDef && defs.InventoryItem.get(collectibleDef.itemHash);
                return reverseItemDef?.displayProperties.icon === item.displayProperties.icon;
              })
            );
          }
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
 * Turn our def-based ornament hashes into DimItems, filtering them down to
 * sets matching the search filter.
 */
export function filterOrnamentSets(
  data: OrnamentsData,
  itemCreationContext: ItemCreationContext,
  searchQuery: string,
  searchFilter: ItemFilter
): OrnamentsData<DimItem> {
  return _.mapValues(data, (classData) => ({
    ...classData,
    sets: Object.fromEntries(
      filterMap(Object.entries(classData.sets), ([key, set]) => {
        const items = filterMap(set.ornaments, (hash) => makeFakeItem(itemCreationContext, hash));
        if (
          !searchQuery ||
          set.name.toLowerCase().includes(searchQuery) ||
          items.some(searchFilter)
        ) {
          return [key, { ...set, ornaments: items }];
        }
        return undefined;
      })
    ),
  }));
}
