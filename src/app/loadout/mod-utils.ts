import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { knownModPlugCategoryHashes } from './known-values';

/**
 * Sorts PluggableInventoryItemDefinition's by the following list of comparators.
 * 1. The known plug category hashes, see ./types#knownModPlugCategoryHashes for ordering
 * 2. itemTypeDisplayName, so that legacy and combat mods are ordered alphabetically by their category name
 * 3. energyType, so mods in each category go Any, Arc, Solar, Void
 * 4. by energy cost, so cheaper mods come before more expensive mods
 * 5. by mod name, so mods in the same category with the same energy type and cost are alphabetical
 */
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((mod) => {
    const knownIndex = knownModPlugCategoryHashes.indexOf(mod.plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mod) => mod.itemTypeDisplayName),
  compareBy((mod) => mod.plug.energyCost?.energyType),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name)
);

/** Sorts an array of PluggableInventoryItemDefinition[]'s by the order of hashes in
 * loadout/know-values#knownModPlugCategoryHashes and then sorts those not found in there by name.
 *
 * This assumes that each PluggableInventoryItemDefinition in each PluggableInventoryItemDefinition[]
 * has the same plugCategoryHash as it pulls it from the first PluggableInventoryItemDefinition.
 */
export const sortModGroups = chainComparator(
  compareBy((mods: PluggableInventoryItemDefinition[]) => {
    // We sort by known knownModPlugCategoryHashes so that it general, helmet, ..., classitem, raid, others.
    const knownIndex = knownModPlugCategoryHashes.indexOf(mods[0].plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mods: PluggableInventoryItemDefinition[]) => mods[0].itemTypeDisplayName)
);

/** Figures out if a definition is an insertable armor 2.0 mod. To do so it does the following
 * 1. Figures out if the def is pluggable (def.plug exists)
 * 2. Checks to see if the plugCategoryHash is in one of our known plugCategoryHashes (relies on d2ai).
 * 3. Checks to see if plug.insertionMaterialRequirementHash is non zero or plug.energyCost a thing. This rules out deprecated mods.
 * 4. Makes sure that itemTypeDisplayName is a thing, this rules out classified items.
 */
export function isInsertableArmor2Mod(
  def: DestinyInventoryItemDefinition
): def is PluggableInventoryItemDefinition {
  return Boolean(
    isPluggableItem(def) &&
      isArmor2Mod(def) &&
      (def.plug.insertionMaterialRequirementHash !== 0 || def.plug.energyCost) &&
      def.itemTypeDisplayName !== undefined
  );
}

/**
 * Generates a unique key for a mod when rendering. As mods can appear multiple times as
 * siblings we need to count them and append a number to its hash to make it unique.
 *
 * Note that counts is mutated and a new object should be passed in with each render.
 */
export const getModRenderKey = (
  mod: PluggableInventoryItemDefinition,
  /** A supplied object to store the counts in. This is mutated. */
  counts: Record<number, number>
) => {
  if (!counts[mod.hash]) {
    counts[mod.hash] = 0;
  }

  return `${mod.hash}-${counts[mod.hash]++}`;
};
