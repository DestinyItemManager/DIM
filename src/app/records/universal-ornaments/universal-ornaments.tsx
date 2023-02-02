import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { profileResponseSelector } from 'app/inventory/selectors';
import { ARMOR_NODE, DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { DestinyPresentationNodeDefinition } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';

export interface OrnamentsSet {
  name: string;
  key: string;
  ornamentHashes: number[];
  parentNodeHash: number;
}

export interface OrnamentsData {
  sets: OrnamentsSet[];
}

export interface OrnamentStatus {
  visibleOrnaments: Set<number>;
  unlockedOrnaments: Set<number>;
}

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

export const buildSets = memoizeOne((defs: D2ManifestDefinitions): OrnamentsData => {
  const collectPresentationNodes = (
    nodeHash: number,
    list: DestinyPresentationNodeDefinition[]
  ) => {
    const def = defs.PresentationNode.get(nodeHash);
    if (def) {
      if (def.children.collectibles.length) {
        list.push(def);
      }
      for (const childNode of def.children.presentationNodes) {
        collectPresentationNodes(childNode.presentationNodeHash, list);
      }
    }
    return list;
  };
  const itemsByPresentationNodeHash: { [key: string]: OrnamentsSet } = {};
  const otherItems: number[] = [];
  const relevantPresentationNodes = collectPresentationNodes(ARMOR_NODE, []);
  for (const plugSetHash of universalOrnamentPlugSetHashes) {
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
        let node = relevantPresentationNodes.find((i) =>
          i.children.collectibles.some(
            (collectible) => collectible.collectibleHash === item.collectibleHash
          )
        );
        if (!node) {
          // Tons of reissued armor sets
          node = relevantPresentationNodes.find((i) =>
            i.children.collectibles.some((collectible) => {
              const collectibleDef = defs.Collectible.get(collectible.collectibleHash);
              return collectibleDef?.displayProperties.name.startsWith(item.displayProperties.name);
            })
          );
        }
        if (!node) {
          // Y1 Trials / Prophecy: Bond Judgment vs. Judgement's Wrap
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
          // Some Titan blue items have the same name but are from different years and look different -> iconWatermark
          // Some Solstice ornaments have the same name as their transmoggable armor pieces -> bucketTypeHash
          const key = `${node.hash}-${
            item.inventory?.bucketTypeHash === BucketHashes.Modifications
          }-${item.iconWatermark}`;
          (itemsByPresentationNodeHash[key] ??= {
            name: node.displayProperties.name,
            key,
            parentNodeHash: node.parentNodeHashes[0],
            ornamentHashes: [],
          }).ornamentHashes.push(item.hash);
        } else {
          otherItems.push(item.hash);
        }
      }
    }
  }

  const sets = Object.values(itemsByPresentationNodeHash);
  sets.push({
    name: 'Other',
    key: '-123',
    parentNodeHash: Number.MAX_SAFE_INTEGER,
    ornamentHashes: otherItems,
  });
  sets.sort(
    chainComparator(
      compareBy((set) => set.parentNodeHash),
      compareBy((set) => set.name)
    )
  );

  return { sets };
});
