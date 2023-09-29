import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ARMOR_NODE } from 'app/search/d2-known-values';
import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyPresentationNodeDefinition,
} from 'bungie-api-ts/destiny2';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import extraItemCollectibles from 'data/d2/unreferenced-collections-items.json';
import _ from 'lodash';
import memoizeOne from 'memoize-one';

// For some items, the most recent versions don't have a collectible. d2ai gives us the most
// recent item hash for given collectibles, so the inverted map gives us the collectible
// for some items.
const extraItemsToCollectibles = _.mapValues(_.invert(extraItemCollectibles), (val) =>
  parseInt(val, 10)
);

function collectPresentationNodes(
  defs: D2ManifestDefinitions,
  nodeHash: number,
  list: DestinyPresentationNodeDefinition[]
) {
  const def = defs.PresentationNode.get(nodeHash);
  if (def && !def.redacted) {
    if (def.children.collectibles.length) {
      list.push(def);
    }
    for (const childNode of def.children.presentationNodes) {
      collectPresentationNodes(defs, childNode.presentationNodeHash, list);
    }
  }
  return list;
}

/**
 * Finds the most likely collectible for a given item definition. Additionally pass in the classType
 * to be able to match armor ornaments that don't indicate a classType by themselves.
 */
export const createCollectibleFinder = memoizeOne((defs: D2ManifestDefinitions) => {
  const cache: { [itemHash: number]: number | null } = {};
  // The Titan/Hunter/Warlock armor presentation nodes, in that order (matches enum order)
  const classPresentationNodes = defs.PresentationNode.get(ARMOR_NODE).children.presentationNodes;

  const armorCollectiblesByClassType = _.once(() =>
    Object.fromEntries(
      [DestinyClass.Titan, DestinyClass.Hunter, DestinyClass.Warlock].map((classType) => {
        const classNode = classPresentationNodes[classType];
        const relevantPresentationNodes = collectPresentationNodes(
          defs,
          classNode.presentationNodeHash,
          []
        );
        const collectibles = relevantPresentationNodes
          .flatMap((node) => node.children?.collectibles ?? [])
          .map((c) => defs.Collectible.get(c.collectibleHash));
        return [classType, collectibles] as const;
      })
    )
  );

  return (itemDef: DestinyInventoryItemDefinition, knownClassType?: DestinyClass) => {
    const cacheEntry = cache[itemDef.hash];
    if (cacheEntry !== undefined) {
      return cacheEntry ?? undefined;
    }

    const collectibleHash = (() => {
      // If this is a fake focusing item, the item we're actually interested in is the output
      const itemHash = focusingItemOutputs[itemDef.hash] ?? itemDef.hash;
      const outputItemDef = defs.InventoryItem.get(itemHash);
      if (!outputItemDef) {
        return undefined;
      }
      // If this has a collectible hash, use that
      if (outputItemDef.collectibleHash) {
        return outputItemDef.collectibleHash;
      }

      // For some items, d2ai knows what the collectible is
      if (extraItemsToCollectibles[itemHash]) {
        return extraItemsToCollectibles[itemHash];
      }

      // Otherwise we try some fuzzy matching with the collectibles.
      // This currently only handles armor, and needs a classType to
      // get the correct armor presentation node. This could potentially
      // be extended to weapons too, but we've not had many problems with weapon
      // collectibles yet and especially in the case of universal ornaments
      // the ornaments themselves don't have a good ICH or classType
      const classType = knownClassType ?? outputItemDef.classType;
      if (!outputItemDef.redacted && classType !== DestinyClass.Unknown) {
        // First, find a collectible with the same name
        const collectibles = armorCollectiblesByClassType()[classType];
        const sameName = collectibles.find(
          (c) => c.displayProperties.name === outputItemDef.displayProperties.name
        );
        if (sameName) {
          return sameName.hash;
        }

        // Sometimes the collectible icon will be different, but reference an item
        // where the icon matches our icon (e.g. Y1 Trials / Prophecy: Bond Judgment vs. Judgement's Wrap)
        const reverseCollectibleMatch = collectibles.find((c) => {
          const reverseItemDef = defs.InventoryItem.get(c.itemHash);
          return reverseItemDef?.displayProperties.icon === outputItemDef.displayProperties.icon;
        });
        if (reverseCollectibleMatch) {
          return reverseCollectibleMatch.hash;
        }
        return undefined;
      }
    })();

    cache[itemDef.hash] = collectibleHash ?? null;
    return collectibleHash;
  };
});
