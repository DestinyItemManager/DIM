import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import memoizeOne from 'memoize-one';

const buildTemplateLookup = memoizeOne((defs: D2ManifestDefinitions) => {
  const results: NodeJS.Dict<DestinyInventoryItemDefinition> = {};
  const invItemTable = defs.InventoryItem.getAll();
  for (const h in invItemTable) {
    const i = invItemTable[h];
    if (i.crafting) {
      results[i.crafting.outputItemHash] = i;
    }
  }
  return results;
});

/**
 * input a weapon's hash. if it's a craftable weapon, this returns the crafting template item.
 * the template contains its possible perks/plugs/etc in proper order.
 *
 * for instance, template 2335939410 outputs weapon 2856514843.
 * only 2335939410 has the barrels & magazines in the right order, and with level requirements attached.
 *
 * KEEP IN MIND: this will be the wrong item hash for, say, wishlists. wishlists are pointed at the *output* item hash.
 */
export function getCraftingTemplate(defs: D2ManifestDefinitions, itemHash: number) {
  return buildTemplateLookup(defs)[itemHash];
}
