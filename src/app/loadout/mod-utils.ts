import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { armor2PlugCategoryHashesByName, armorBuckets } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { DestinyEnergyType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import { canSwapEnergyFromUpgradeSpendTier } from './armor-upgrade-utils';
import { knownModPlugCategoryHashes } from './known-values';

/** The plug category hashes that belong to the 5th mod slot, such as raid and nightmare mods. */
export const activityModPlugCategoryHashes = [
  ...raidModPlugCategoryHashes,
  PlugCategoryHashes.EnhancementsSeasonMaverick,
];

export const bucketsToCategories = {
  [armorBuckets.helmet]: armor2PlugCategoryHashesByName.helmet,
  [armorBuckets.gauntlets]: armor2PlugCategoryHashesByName.gauntlets,
  [armorBuckets.chest]: armor2PlugCategoryHashesByName.chest,
  [armorBuckets.leg]: armor2PlugCategoryHashesByName.leg,
  [armorBuckets.classitem]: armor2PlugCategoryHashesByName.classitem,
};

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
      // is plug.insertionMaterialRequirementHash non zero or is plug.energyCost a thing. This rules out deprecated mods.
      (def.plug.insertionMaterialRequirementHash !== 0 || def.plug.energyCost) &&
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
 * This is used to figure out the energy type of an item used in mod assignments.
 *
 * It first considers if there are bucket specific mods applied, and returns that
 * energy type if it's not Any. If not then it considers armour upgrade options
 * and returns the appropriate energy type from that.
 *
 * It can return the Any energy type if armour upgrade options allow energy changes.
 */
export function getItemEnergyType(
  defs: D2ManifestDefinitions,
  item: DimItem,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  bucketSpecificMods?: PluggableInventoryItemDefinition[]
) {
  if (!item.energy) {
    return DestinyEnergyType.Any;
  }

  const bucketSpecificModType = bucketSpecificMods?.find(
    (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
  )?.plug.energyCost?.energyType;

  // if we find bucket specific mods with an energy type we have to use that
  if (bucketSpecificModType) {
    return bucketSpecificModType;
  }

  return canSwapEnergyFromUpgradeSpendTier(defs, upgradeSpendTier, item, lockItemEnergyType)
    ? DestinyEnergyType.Any
    : item.energy.energyType;
}

// this exists because singleInitialItemHash may be absent,
// for example on Artifice Armor. in that case, the default
// plug can be found in the socket's reusable PlugSet.

/**
 * gets the InventoryItem hash corresponding to a socket's default contents
 * (what should be plugged in order to "revert/clear" it)
 */
export function getDefaultPlugHash(socket: DimSocket, defs?: D2ManifestDefinitions) {
  if (socket.plugged) {
    const { singleInitialItemHash, reusablePlugSetHash } = socket.socketDefinition;
    return singleInitialItemHash
      ? singleInitialItemHash
      : reusablePlugSetHash
      ? defs?.PlugSet.get(reusablePlugSetHash).reusablePlugItems[0].plugItemHash
      : undefined;
  }
}

/**
 * group a whole variety of mod definitions into related mod-type groups
 */
export function groupModsByModType(plugs: PluggableInventoryItemDefinition[]) {
  // allow a plug category hash to be "locked" to
  // the first itemTypeDisplayName that shows up using it.
  // this prevents "Class Item Mod" and "Class Item Armor Mod"
  // from forming two different categories
  const nameByPCH: NodeJS.Dict<string> = {};

  const ret = _.groupBy(
    plugs,
    (plugDef) =>
      (nameByPCH[plugDef.plug.plugCategoryHash] ??=
        plugDef.itemTypeDisplayName || plugDef.itemTypeAndTierDisplayName)
  );
  console.log(nameByPCH);
  console.log(ret);
  return ret;
}
