import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { generateModPermutations } from 'app/loadout/mod-permutations';
import { armor2PlugCategoryHashesByName, armorBuckets } from 'app/search/d2-known-values';
import {
  combatCompatiblePlugCategoryHashes,
  ModSocketMetadata,
} from 'app/search/specialty-modslots';
import { chainComparator, compareBy } from 'app/utils/comparators';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
  isArmor2Mod,
} from 'app/utils/item-utils';
import { DestinyEnergyType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import {
  canSwapEnergyFromUpgradeSpendTier,
  upgradeSpendTierToMaxEnergy,
} from './armor-upgrade-utils';
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
    const knownIndex = knownModPlugCategoryHashes.indexOf(mods[0].plug.plugCategoryHash);
    return knownIndex === -1 ? knownModPlugCategoryHashes.length : knownIndex;
  }),
  compareBy((mods: PluggableInventoryItemDefinition[]) => mods[0].itemTypeDisplayName)
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

/** Used to track assigned and unassigned mods during the mod assignment algorithm.  */
interface ModAssignments {
  [itemId: string]: {
    assigned: PluggableInventoryItemDefinition[];
    unassigned: PluggableInventoryItemDefinition[];
  };
}

/**
 * This finds the cheapest possible mod assignments for an armour set and a set of mods. It
 * doesn't need to assign all mods but it will find a set with as many assigned as possible.
 *
 * It uses the idea of total energy spent and wasted to rank mod assignments.
 *
 * To do this we create permutations of general, combat and activity mods and loop over each
 * set of permutations and validate the combination. Validate is done via a lower number of
 * unassigned mods or an equal amount of unassigned mods and a lower energy cost.
 */
export function getCheapestModAssignments(
  items: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  defs: D2ManifestDefinitions | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
): {
  itemModAssignments: Map<string, PluggableInventoryItemDefinition[]>;
  unassignedMods: PluggableInventoryItemDefinition[];
} {
  if (!defs) {
    return { itemModAssignments: new Map(), unassignedMods: [] };
  }

  let bucketIndependentAssignments: ModAssignments = {};
  const bucketSpecificAssignments: ModAssignments = {};

  // just an arbitrarily large number
  let assignmentEnergyCost = 10000;
  let assignmentUnassignedModCount = 10000;

  for (const item of items) {
    bucketSpecificAssignments[item.id] = { assigned: [], unassigned: [] };
    bucketIndependentAssignments[item.id] = { assigned: [], unassigned: [] };
  }

  // An object of item id's to specialty socket metadata, this is used to ensure that
  // combat and activity mods can be slotted into an item.
  const itemSocketMetadata = _.mapValues(
    _.keyBy(items, (item) => item.id),
    (item) => getSpecialtySocketMetadatas(item)
  );

  const generalMods: PluggableInventoryItemDefinition[] = [];
  const combatMods: PluggableInventoryItemDefinition[] = [];
  const activityMods: PluggableInventoryItemDefinition[] = [];

  // Divide up the locked mods into general, combat and activity mod arrays. Also we
  // take the bucket specific mods and put them in a map of item id's to mods so
  // we can calculate the used energy values for each item
  for (const mod of mods) {
    if (mod.plug.plugCategoryHash === armor2PlugCategoryHashesByName.general) {
      generalMods.push(mod);
    } else if (combatCompatiblePlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
      combatMods.push(mod);
    } else if (activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
      activityMods.push(mod);
    } else {
      const itemForMod = items.find(
        (item) => mod.plug.plugCategoryHash === bucketsToCategories[item.bucket.hash]
      );

      if (
        itemForMod &&
        isBucketSpecificModValid(
          defs,
          upgradeSpendTier,
          lockItemEnergyType,
          itemForMod,
          mod,
          bucketSpecificAssignments[itemForMod.id].assigned
        )
      ) {
        bucketSpecificAssignments[itemForMod.id].assigned.push(mod);
      } else if (itemForMod) {
        bucketSpecificAssignments[itemForMod.id].unassigned.push(mod);
      }
    }
  }

  // A object of item id's to energy information. This is so we can precalculate
  // working energy used, capacity and type and use this to validate whether a mod
  // can be used in an item.
  const itemEnergies = _.mapValues(
    _.keyBy(items, (item) => item.id),
    (item) =>
      buildItemEnergy(
        defs,
        item,
        bucketSpecificAssignments[item.id].assigned,
        upgradeSpendTier,
        lockItemEnergyType
      )
  );

  const generalModPermutations = generateModPermutations(generalMods);
  const combatModPermutations = generateModPermutations(combatMods);
  const activityModPermutations = generateModPermutations(activityMods);

  for (const activityPermutation of activityModPermutations) {
    for (const combatPermutation of combatModPermutations) {
      modLoop: for (const generalPermutation of generalModPermutations) {
        let unassignedModCount = 0;
        const assignments: ModAssignments = {};

        for (let i = 0; i < items.length; i++) {
          const assigned = [];
          const unassigned = [];
          const item = items[i];

          const activityMod = activityPermutation[i];
          if (
            activityMod &&
            isActivityModValid(activityMod, itemSocketMetadata[item.id], itemEnergies[item.id])
          ) {
            assigned.push(activityMod);
          } else if (activityMod) {
            unassigned.push(activityMod);
          }

          const combatMod = combatPermutation[i];
          if (
            combatMod &&
            isCombatModValid(
              combatMod,
              assigned,
              itemSocketMetadata[item.id],
              itemEnergies[item.id]
            )
          ) {
            assigned.push(combatMod);
          } else if (combatMod) {
            unassigned.push(combatMod);
          }

          const generalMod = generalPermutation[i];
          if (generalMod && isModEnergyValid(itemEnergies[item.id], generalMod, ...assigned)) {
            assigned.push(generalMod);
          } else if (generalMod) {
            unassigned.push(generalMod);
          }

          if (unassignedModCount + unassigned.length > assignmentUnassignedModCount) {
            continue modLoop;
          }

          unassignedModCount += unassigned.length;
          assignments[item.id] = { assigned, unassigned };
        }

        // This is after the item loop
        let energyUsedAndWasted = 0;
        for (const [itemId, { assigned }] of Object.entries(assignments)) {
          energyUsedAndWasted += calculateEnergyChange(itemEnergies[itemId], assigned);
        }

        // if the cost of the new assignment set is better than the old one
        // we replace it and carry on until we have exhausted all permutations.
        if (
          unassignedModCount < assignmentUnassignedModCount ||
          (unassignedModCount <= assignmentUnassignedModCount &&
            energyUsedAndWasted < assignmentEnergyCost)
        ) {
          bucketIndependentAssignments = assignments;
          assignmentEnergyCost = energyUsedAndWasted;
          assignmentUnassignedModCount = unassignedModCount;
        }
      }
    }
  }

  const mergedResults = new Map<string, PluggableInventoryItemDefinition[]>();
  let unassignedMods: PluggableInventoryItemDefinition[] = [];
  for (const item of items) {
    const independentAssignments = bucketIndependentAssignments[item.id];
    const specificAssignments = bucketSpecificAssignments[item.id];
    mergedResults.set(item.id, [
      ...independentAssignments.assigned,
      ...specificAssignments.assigned,
    ]);
    unassignedMods = [
      ...unassignedMods,
      ...independentAssignments.unassigned,
      ...specificAssignments.unassigned,
    ];
  }

  return { itemModAssignments: mergedResults, unassignedMods };
}

interface ItemEnergy {
  used: number;
  originalCapacity: number;
  derivedCapacity: number;
  originalType: DestinyEnergyType;
  derivedType: DestinyEnergyType;
}

function buildItemEnergy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  assignedMods: PluggableInventoryItemDefinition[],
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
): ItemEnergy {
  return {
    used: _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0),
    originalCapacity: item.energy?.energyCapacity || 0,
    derivedCapacity: upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item),
    originalType: item.energy?.energyType || DestinyEnergyType.Any,
    derivedType: getItemEnergyType(defs, item, upgradeSpendTier, lockItemEnergyType, assignedMods),
  };
}

function isBucketSpecificModValid(
  defs: D2ManifestDefinitions,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  item: DimItem,
  mod: PluggableInventoryItemDefinition,
  assignedMods: PluggableInventoryItemDefinition[]
) {
  const itemEnergyCapacity = upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item);
  const itemEnergyType = getItemEnergyType(
    defs,
    item,
    upgradeSpendTier,
    lockItemEnergyType,
    assignedMods
  );
  const energyUsed = _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0);
  const modCost = mod.plug.energyCost?.energyCost || 0;
  const modEnergyType = mod.plug.energyCost?.energyType || DestinyEnergyType.Any;
  const energyTypeIsValid =
    modEnergyType === itemEnergyType ||
    modEnergyType === DestinyEnergyType.Any ||
    itemEnergyType === DestinyEnergyType.Any;

  return energyTypeIsValid && energyUsed + modCost <= itemEnergyCapacity;
}

function isActivityModValid(
  activityMod: PluggableInventoryItemDefinition,
  itemSocketMetadata: ModSocketMetadata[] | undefined,
  itemEnergy: ItemEnergy
) {
  const modTag = getModTypeTagByPlugCategoryHash(activityMod.plug.plugCategoryHash);

  // The activity mods wont fit in the item set so move on to the next set of mods
  return (
    isModEnergyValid(itemEnergy, activityMod) &&
    modTag &&
    itemSocketMetadata?.some((metadata) => metadata.compatibleModTags.includes(modTag))
  );
}

function isCombatModValid(
  combatMod: PluggableInventoryItemDefinition,
  assignedMods: PluggableInventoryItemDefinition[],
  itemSocketMetadata: ModSocketMetadata[] | undefined,
  itemEnergy: ItemEnergy
) {
  const modTag = getModTypeTagByPlugCategoryHash(combatMod.plug.plugCategoryHash);

  // The activity mods wont fit in the item set so move on to the next set of mods
  return (
    isModEnergyValid(itemEnergy, combatMod, ...assignedMods) &&
    modTag &&
    itemSocketMetadata?.some((metadata) => metadata.compatibleModTags.includes(modTag))
  );
}

function calculateEnergyChange(
  itemEnergy: ItemEnergy,
  assignedMods: PluggableInventoryItemDefinition[]
) {
  let finalEnergy = itemEnergy.derivedType;

  for (const mod of assignedMods) {
    if (finalEnergy !== DestinyEnergyType.Any) {
      break;
    } else if (mod.plug.energyCost?.energyType) {
      finalEnergy = mod.plug.energyCost.energyType;
    }
  }

  const modCost =
    itemEnergy.used + _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0);
  const energyUsedAndWasted = modCost + itemEnergy.originalCapacity;
  const energyInvested = Math.max(0, modCost - itemEnergy.originalCapacity);

  return finalEnergy === itemEnergy.originalType || finalEnergy === DestinyEnergyType.Any
    ? energyInvested
    : energyUsedAndWasted;
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

/**
 * Validates whether a mod can be assigned to an item in the mod assignments algorithm.
 *
 * This checks that the summed mod energies are within the derived mod capacity for
 * an item (derived from armour upgrade options). It also ensures that all the mod
 * energy types align and that the mod can be slotted into an item socket based on
 * item energy type.
 */
export function isModEnergyValid(
  itemEnergy: ItemEnergy,
  modToAssign: PluggableInventoryItemDefinition,
  ...assignedMods: (PluggableInventoryItemDefinition | null)[]
) {
  const modToAssignCost = modToAssign.plug.energyCost?.energyCost || 0;
  const modToAssignType = modToAssign.plug.energyCost?.energyType || DestinyEnergyType.Any;
  const assignedModsCost = _.sumBy(assignedMods, (mod) => mod?.plug.energyCost?.energyCost || 0);

  return (
    itemEnergy.used + modToAssignCost + assignedModsCost <= itemEnergy.derivedCapacity &&
    energyTypesAreCompatible(itemEnergy.derivedType, modToAssignType) &&
    assignedMods.every((mod) =>
      energyTypesAreCompatible(
        modToAssignType,
        mod?.plug.energyCost?.energyType || DestinyEnergyType.Any
      )
    )
  );
}

function energyTypesAreCompatible(first: DestinyEnergyType, second: DestinyEnergyType) {
  return first === second || first === DestinyEnergyType.Any || second === DestinyEnergyType.Any;
}
