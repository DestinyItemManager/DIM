import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { armor2PlugCategoryHashesByName, armorBuckets } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import { BucketHashes } from 'data/d2/generated-enums';
import { normalToReducedMod, reducedToNormalMod } from 'data/d2/reduced-cost-mod-mappings';
import _ from 'lodash';
import { knownModPlugCategoryHashes } from './known-values';

export const plugCategoryHashToBucketHash = {
  [armor2PlugCategoryHashesByName.helmet]: armorBuckets.helmet,
  [armor2PlugCategoryHashesByName.gauntlets]: armorBuckets.gauntlets,
  [armor2PlugCategoryHashesByName.chest]: armorBuckets.chest,
  [armor2PlugCategoryHashesByName.leg]: armorBuckets.leg,
  [armor2PlugCategoryHashesByName.classitem]: armorBuckets.classitem,
};

/**
 * Sorts PluggableInventoryItemDefinition's by the following list of comparators.
 * 1. The known plug category hashes, see ./types#knownModPlugCategoryHashes for ordering
 * 2. itemTypeDisplayName, so that legacy and combat mods are ordered alphabetically by their category name
 * 4. by energy cost, so cheaper mods come before more expensive mods
 * 5. by mod name, so mods in the same category with the same energy type and cost are alphabetical
 */
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((mod) => {
    const knownIndex = knownModPlugCategoryHashes.indexOf(mod.plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mod) => mod.itemTypeDisplayName),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name)
);

/**
 * Sorts an array of PluggableInventoryItemDefinition[]'s by the order of hashes in
 * loadout/know-values#knownModPlugCategoryHashes and then sorts those not found in there by name.
 *
 * This assumes that each PluggableInventoryItemDefinition in each PluggableInventoryItemDefinition[]
 * has the same plugCategoryHash as it pulls it from the first PluggableInventoryItemDefinition.
 */
export const sortModGroups = chainComparator(
  compareBy((mods: PluggableInventoryItemDefinition[]) => {
    // We sort by known knownModPlugCategoryHashes so that it general, helmet, ..., classitem, raid, others.
    const knownIndex = mods.length
      ? knownModPlugCategoryHashes.indexOf(mods[0].plug.plugCategoryHash)
      : -1;
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mods: PluggableInventoryItemDefinition[]) =>
    mods.length ? mods[0].itemTypeDisplayName : ''
  )
);

/** Figures out if an item definition is an insertable armor 2.0 mod. */
export function isInsertableArmor2Mod(
  def: DestinyInventoryItemDefinition
): def is PluggableInventoryItemDefinition {
  return Boolean(
    // is the def pluggable (def.plug exists)
    isPluggableItem(def) &&
      // is the plugCategoryHash is in one of our known plugCategoryHashes (relies on d2ai).
      isArmor2Mod(def) &&
      // is it actually something relevant
      !emptyPlugHashes.has(def.hash) &&
      !deprecatedMods.includes(def.hash) &&
      // Exclude consumable mods
      def.inventory?.bucketTypeHash !== BucketHashes.Modifications &&
      // this rules out classified items
      def.itemTypeDisplayName !== undefined
  );
}

/**
 * Supplies a function that generates a unique key for a mod when rendering.
 * As mods can appear multiple times as siblings we need to count them and append a
 * number to its hash to make it unique.
 */
export function createGetModRenderKey() {
  const counts = {};
  return (mod: PluggableInventoryItemDefinition) => {
    if (!counts[mod.hash]) {
      counts[mod.hash] = 0;
    }

    return `${mod.hash}-${counts[mod.hash]++}`;
  };
}

/**
 * Group an array of mod definitions into related mod-type groups
 *
 * e.g. "General Armor Mod", "Helmet Armor Mod", "Nightmare Mod"
 */
export function groupModsByModType(plugs: PluggableInventoryItemDefinition[]) {
  return _.groupBy(plugs, (plugDef) => plugDef.itemTypeDisplayName);
}

/**
 * Some mods have two copies, a regular version and a reduced-cost version.
 * Only some of them are seasonally available, depending on artifact mods/unlocks.
 * This maps to whichever version is available, otherwise returns plugHash unmodified.
 */
export function mapToAvailableModCostVariant(plugHash: number, unlockedPlugs: Set<number>) {
  const toReduced = normalToReducedMod[plugHash];
  if (toReduced !== undefined && unlockedPlugs.has(toReduced)) {
    return toReduced;
  }
  if (unlockedPlugs.has(plugHash)) {
    return plugHash;
  }
  const toNormal = reducedToNormalMod[plugHash];
  if (toNormal !== undefined && unlockedPlugs.has(toNormal)) {
    return toNormal;
  }
  return plugHash;
}

/**
 * Internally we should try to always store the normal version of the mod though.
 */
export function mapToNonReducedModCostVariant(plugHash: number): number {
  return reducedToNormalMod[plugHash] ?? plugHash;
}

/**
 * Find the complementary cost variant.
 */
export function mapToOtherModCostVariant(plugHash: number): number | undefined {
  return reducedToNormalMod[plugHash] ?? normalToReducedMod[plugHash];
}
