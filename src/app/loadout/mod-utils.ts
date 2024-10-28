import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { chainComparator, compareBy, compareByIndex } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { LookupTable } from 'app/utils/util-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import mutuallyExclusiveMods from 'data/d2/mutually-exclusive-mods.json';
import { normalToReducedMod, reducedToNormalMod } from 'data/d2/reduced-cost-mod-mappings';
import { knownModPlugCategoryHashes } from './known-values';

export const plugCategoryHashToBucketHash: LookupTable<PlugCategoryHashes, BucketHashes> = {
  [armor2PlugCategoryHashesByName.helmet]: BucketHashes.Helmet,
  [armor2PlugCategoryHashesByName.gauntlets]: BucketHashes.Gauntlets,
  [armor2PlugCategoryHashesByName.chest]: BucketHashes.ChestArmor,
  [armor2PlugCategoryHashesByName.leg]: BucketHashes.LegArmor,
  [armor2PlugCategoryHashesByName.classitem]: BucketHashes.ClassArmor,
};

/**
 * Sorts PluggableInventoryItemDefinition's by the following list of comparators.
 * 1. The known plug category hashes, see ./types#knownModPlugCategoryHashes for ordering
 * 2. itemTypeDisplayName, so that legacy and combat mods are ordered alphabetically by their category name
 * 4. by energy cost, so cheaper mods come before more expensive mods
 * 5. by mod name, so mods in the same category with the same energy cost are alphabetical
 */
export const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareByIndex(knownModPlugCategoryHashes, (mod) => mod.plug.plugCategoryHash),
  compareBy((mod) => mod.itemTypeDisplayName),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name),
);

/**
 * Sorts an array of PluggableInventoryItemDefinition[]'s by the order of hashes in
 * loadout/know-values#knownModPlugCategoryHashes and then sorts those not found in there by name.
 *
 * This assumes that each PluggableInventoryItemDefinition in each PluggableInventoryItemDefinition[]
 * has the same plugCategoryHash as it pulls it from the first PluggableInventoryItemDefinition.
 */
export const sortModGroups = chainComparator<PluggableInventoryItemDefinition[]>(
  // We sort by known knownModPlugCategoryHashes so that it general, helmet, ..., classitem, raid, others.
  compareByIndex(knownModPlugCategoryHashes, (mods) =>
    mods.length ? mods[0].plug.plugCategoryHash : undefined,
  ),
  compareBy((mods) => (mods.length ? mods[0].itemTypeDisplayName : '')),
);

/** Figures out if an item definition is an insertable armor 2.0 mod. */
export function isInsertableArmor2Mod(
  def: DestinyInventoryItemDefinition,
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
      def.itemTypeDisplayName !== undefined,
  );
}

/**
 * Supplies a function that generates a unique key for a mod when rendering.
 * As mods can appear multiple times as siblings we need to count them and append a
 * number to its hash to make it unique.
 */
export function createGetModRenderKey() {
  const counts: { [modHash: string]: number } = {};
  return (mod: PluggableInventoryItemDefinition) => {
    counts[mod.hash] ||= 0;
    return `${mod.hash}-${counts[mod.hash]++}`;
  };
}

/**
 * Group an array of mod definitions into related mod-type groups
 *
 * e.g. "General Armor Mod", "Helmet Armor Mod", "Nightmare Mod"
 */
export function groupModsByModType(plugs: PluggableInventoryItemDefinition[]) {
  const plugHeader = (plug: PluggableInventoryItemDefinition) => {
    // Annoyingly some Prismatic plugs' itemTypeDisplayNames include the damage type and light/dark,
    // so map them to a common header here
    if (plug.plug.plugCategoryIdentifier.endsWith('.prism.aspects')) {
      return t('Loadouts.Prismatic.Aspect');
    } else if (plug.plug.plugCategoryIdentifier.endsWith('.prism.supers')) {
      return t('Loadouts.Prismatic.Super');
    } else if (plug.plug.plugCategoryIdentifier.endsWith('.prism.grenades')) {
      return t('Loadouts.Prismatic.Grenade');
    } else if (plug.plug.plugCategoryIdentifier.endsWith('.prism.melee')) {
      return t('Loadouts.Prismatic.Melee');
    } else {
      return plug.itemTypeDisplayName;
    }
  };
  return Object.groupBy(plugs, plugHeader);
}

/**
 * Some mods have two copies, a regular version and a reduced-cost version.
 * Only some of them are seasonally available, depending on artifact mods/unlocks.
 * This maps to whichever version is available, otherwise returning the expensive versions.
 */
export function mapToAvailableModCostVariant(plugHash: number, unlockedPlugs: Set<number>) {
  const reducedVersion = isReducedModCostVariant(plugHash)
    ? plugHash
    : normalToReducedMod[plugHash];
  if (reducedVersion !== undefined && unlockedPlugs.has(reducedVersion)) {
    return reducedVersion;
  }
  if (unlockedPlugs.has(plugHash)) {
    return plugHash;
  }
  const toNormal = reducedToNormalMod[plugHash];
  return toNormal ?? plugHash;
}

/**
 * Internally we should try to always store the normal version of the mod though.
 */
export function mapToNonReducedModCostVariant(plugHash: number): number {
  return reducedToNormalMod[plugHash] ?? plugHash;
}

export function isReducedModCostVariant(plugHash: number): boolean {
  return reducedToNormalMod[plugHash] !== undefined;
}

/**
 * Find the complementary cost variant.
 */
export function mapToOtherModCostVariant(plugHash: number): number | undefined {
  return reducedToNormalMod[plugHash] ?? normalToReducedMod[plugHash];
}

/**
 * Some mods form a group of which only one mod can be equipped,
 * which is enforced by game servers. DIM must respect this when building
 * loadouts or applying mods.
 */
export function getModExclusionGroup(mod: PluggableInventoryItemDefinition): string | undefined {
  return mutuallyExclusiveMods[mod.hash];
}
