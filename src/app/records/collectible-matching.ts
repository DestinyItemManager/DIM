import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { ARMOR_NODE } from 'app/search/d2-known-values';
import { invert } from 'app/utils/collections';
import {
  DestinyClass,
  DestinyCollectibleDefinition,
  DestinyInventoryItemDefinition,
  DestinyPresentationNodeDefinition,
} from 'bungie-api-ts/destiny2';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import extraItemCollectibles from 'data/d2/unreferenced-collections-items.json';
import { keyBy, once } from 'es-toolkit';
import memoizeOne from 'memoize-one';

// For some items, the most recent versions don't have a collectible. d2ai gives us the most
// recent item hash for given collectibles, so the inverted map gives us the collectible
// for some items.
const extraItemsToCollectibles = invert(extraItemCollectibles, Number);

function collectPresentationNodes(
  defs: D2ManifestDefinitions,
  nodeHash: number,
  list: DestinyPresentationNodeDefinition[],
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
  const cache: { [itemHash: number]: DestinyCollectibleDefinition | null } = {};

  const armorCollectiblesByClassType = once(() => {
    // The Titan/Hunter/Warlock armor presentation nodes, in that order (matches enum order)
    const classPresentationNodes = defs.PresentationNode.get(ARMOR_NODE).children.presentationNodes;
    return Object.fromEntries(
      [DestinyClass.Titan, DestinyClass.Hunter, DestinyClass.Warlock].map((classType) => {
        const classNode = classPresentationNodes[classType];
        const relevantPresentationNodes = collectPresentationNodes(
          defs,
          classNode.presentationNodeHash,
          [],
        );
        const collectibles = relevantPresentationNodes
          .flatMap((node) => node.children?.collectibles ?? [])
          .map((c) => defs.Collectible.get(c.collectibleHash));
        // Most of the time, collectibles will have the same name
        const collectiblesByName = keyBy(collectibles, (c) => c.displayProperties.name);
        // Sometimes the collectible name and icon will be different, but reference an item
        // where the icon matches our icon (e.g. Y1 Trials / Prophecy: Bond Judgment vs. Judgement's Wrap)
        const collectiblesByReverseItemIcon = keyBy(
          collectibles,
          (c) => defs.InventoryItem.get(c.itemHash)?.displayProperties.icon,
        );
        return [classType, { collectiblesByName, collectiblesByReverseItemIcon }] as const;
      }),
    );
  });

  return (
    itemDef: DestinyInventoryItemDefinition,
    knownClassType?: DestinyClass,
  ): DestinyCollectibleDefinition | undefined => {
    const cacheEntry = cache[itemDef.hash];
    if (cacheEntry !== undefined) {
      return cacheEntry ?? undefined;
    }

    const collectible = (() => {
      // If this is a fake focusing item, the item we're actually interested in is the output
      const itemHash = focusingItemOutputs[itemDef.hash] ?? itemDef.hash;
      const outputItemDef = defs.InventoryItem.get(itemHash);
      if (!outputItemDef) {
        return undefined;
      }
      // If this has a collectible hash, use that
      if (outputItemDef.collectibleHash) {
        return defs.Collectible.get(outputItemDef.collectibleHash);
      }

      // For some items, d2ai knows what the collectible is
      if (extraItemsToCollectibles[itemHash]) {
        return defs.Collectible.get(extraItemsToCollectibles[itemHash]);
      }

      // Otherwise we try some fuzzy matching with the collectibles.
      // This currently only handles armor, and needs a classType to
      // get the correct armor presentation node. This could potentially
      // be extended to weapons too, but we've not had many problems with weapon
      // collectibles yet and especially in the case of universal ornaments
      // the ornaments themselves don't have a good ICH or classType
      const classType = knownClassType ?? outputItemDef.classType;
      if (!outputItemDef.redacted && classType !== DestinyClass.Unknown) {
        const { collectiblesByName, collectiblesByReverseItemIcon } =
          armorCollectiblesByClassType()[classType];
        return (
          collectiblesByName[outputItemDef.displayProperties.name] ??
          collectiblesByReverseItemIcon[outputItemDef.displayProperties.icon]
        );
      }
    })();

    cache[itemDef.hash] = collectible ?? null;
    return collectible;
  };
});
