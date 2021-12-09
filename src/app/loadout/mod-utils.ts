import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { PluggingAction } from 'app/loadout-drawer/loadout-types';
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
  getSpecialtySockets,
  isArmor2Mod,
  modMetadataBySocketTypeHash,
} from 'app/utils/item-utils';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { DestinyEnergyType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
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

/**
 * a temporary structure, keyed by item ID,
 * used to track which mods have been assigned to each item,
 * and which mods were unable to be assigned to each item
 */
interface ModAssignments {
  [itemId: string]: {
    /* which mods are currently proposed to get assigned to this item */
    assigned: PluggableInventoryItemDefinition[];
    /* which mods didn't meet the conditions to be assigned to this item */
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
 *
 * This returns a list of `unassignedMods` it was unable to find places for,
 * and `itemModAssignments`, an item ID-keyed dictionary of *ordered* instructions
 * for which mods to apply to each item
 */
export function getCheapestModAssignments(
  /** a set (i.e. helmet, arms, etc) of items that we are trying to assign mods to */
  items: DimItem[],
  /** mods we are trying to place on the items */
  plannedMods: PluggableInventoryItemDefinition[],
  defs: D2ManifestDefinitions,
  upgradeSpendTier = UpgradeSpendTier.Nothing,
  lockItemEnergyType = true
): {
  itemModAssignments: {
    [itemInstanceId: string]: PluggingAction[];
  };
  unassignedMods: PluggableInventoryItemDefinition[];
} {
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
  // take the bucket specific mods and put them in a map of item ids to mods so
  // we can calculate the used energy values for each item
  for (const plannedMod of plannedMods) {
    if (plannedMod.plug.plugCategoryHash === armor2PlugCategoryHashesByName.general) {
      generalMods.push(plannedMod);
    } else if (combatCompatiblePlugCategoryHashes.includes(plannedMod.plug.plugCategoryHash)) {
      combatMods.push(plannedMod);
    } else if (activityModPlugCategoryHashes.includes(plannedMod.plug.plugCategoryHash)) {
      activityMods.push(plannedMod);
    } else {
      // possible target for plugging this mod
      const targetItem = items.find(
        (item) => plannedMod.plug.plugCategoryHash === bucketsToCategories[item.bucket.hash]
      );

      if (targetItem) {
        if (
          isBucketSpecificModValid(
            defs,
            upgradeSpendTier,
            lockItemEnergyType,
            targetItem,
            plannedMod,
            bucketSpecificAssignments[targetItem.id].assigned
          )
        ) {
          bucketSpecificAssignments[targetItem.id].assigned.push(plannedMod);
        } else {
          bucketSpecificAssignments[targetItem.id].unassigned.push(plannedMod);
        }
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

  const mergedResults: {
    [itemInstanceId: string]: PluggingAction[];
  } = {};
  let unassignedMods: PluggableInventoryItemDefinition[] = [];

  for (const item of items) {
    const independentAssignments = bucketIndependentAssignments[item.id];
    const specificAssignments = bucketSpecificAssignments[item.id];
    mergedResults[item.id] = createPluggingStrategy(
      defs,
      item,
      specificAssignments.assigned,
      independentAssignments.assigned
    );

    unassignedMods = [
      ...unassignedMods,
      ...independentAssignments.unassigned,
      ...specificAssignments.unassigned,
    ];
  }

  return { itemModAssignments: mergedResults, unassignedMods };
}

/**
 * For a given item, and mods that need attaching,
 * this creates an ordered list of plugging actions, which:
 * - prefer plugging desired mod X into a slot that already has X
 * - remove or swap in cheaper mods to free up enough armor energy, before applying those which cost more
 * - mark mod removals as optional, if they aren't required to free up a slot or energy
 *
 * THIS ASSUMES THE SUPPLIED ASSIGNMENTS ARE POSSIBLE,
 * on this item, with its specific mod slots, and will throw if they are not.
 * this doesn't account for total armor energy, just orders the swaps to avoid overusing energy points.
 */
function createPluggingStrategy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  bucketSpecificAssignments: PluggableInventoryItemDefinition[],
  bucketIndependentAssignments: PluggableInventoryItemDefinition[]
) {
  const modsToInsert = [...bucketIndependentAssignments, ...bucketSpecificAssignments];

  // collect a list of socketdefs for only the sockets we can assign to
  const armorModIndexes = item.sockets?.categories.find(
    ({ category }) => category.hash === SocketCategoryHashes.ArmorMods
  )?.socketIndexes;

  // YES, we address this by index.
  // but only because we are find()ing through it and seeking a DimSocket object.
  // at the end, we will properly extract that DimSocket's socketIndex
  const existingModSockets = getSocketsByIndexes(item.sockets!, armorModIndexes || []);

  // stuff we need to apply, that frees up energy. we'll apply these first
  const requiredRegains: PluggingAction[] = [];
  // stuff we need to apply, but it will cost us...
  const requiredSpends: PluggingAction[] = [];
  // stuff we MAY apply, if we need more energy freed up
  const optionalRegains: PluggingAction[] = [];

  for (const modToInsert of modsToInsert) {
    // If this mod is already plugged somewhere, that's the slot we want to keep it in
    let destinationSocketIndex = existingModSockets.findIndex(
      (socket) => socket.plugged?.plugDef.hash === modToInsert.hash
    );

    // If it wasn't found already plugged, find the first socket with a matching PCH
    // TO-DO: this is naive and is going to fail for artificer armor
    if (destinationSocketIndex === -1) {
      destinationSocketIndex = existingModSockets.findIndex(
        (socket) =>
          socket.plugged?.plugDef.plug.plugCategoryHash === modToInsert.plug.plugCategoryHash
      );
    }

    // If we didn't find a matching PCH, check deeper for any specialty sockets,
    // which may support multiple PCHes
    if (destinationSocketIndex === -1) {
      const specialtySockets = getSpecialtySockets(item) || [];
      for (const socket of specialtySockets) {
        const metadata = modMetadataBySocketTypeHash[socket.socketDefinition.socketTypeHash];
        if (metadata?.compatiblePlugCategoryHashes.includes(modToInsert.plug.plugCategoryHash)) {
          destinationSocketIndex = existingModSockets.indexOf(socket);
          break;
        }
      }
    }

    // If a destination socket couldn't be found for this plug, something is seriously? wrong
    if (destinationSocketIndex === -1) {
      throw new Error(
        `We couldn't find anywhere to plug the mod ${modToInsert.displayProperties.name} (${modToInsert.hash})`
      );
    }

    // we found it!! this is where we have chosen to place the mod
    const destinationSocket = existingModSockets[destinationSocketIndex];

    const existingModCost = destinationSocket.plugged?.plugDef.plug.energyCost?.energyCost || 0;
    const plannedModCost = modToInsert.plug.energyCost?.energyCost || 0;
    const energySpend = plannedModCost - existingModCost;

    (energySpend >= 0 ? requiredSpends : requiredRegains).push({
      socketIndex: destinationSocket.socketIndex,
      mod: modToInsert,
      energySpend,
      required: true,
    });

    // remove this existing socket from consideration
    existingModSockets.splice(destinationSocketIndex, 1);
  }

  // For each remaining socket that won't have mods assigned,
  // return it to its default (usually "Empty Mod Socket")
  // TO-DO: here's another thing that will fail for artificer armor.
  // those have no singleInitialItemHash
  for (const leftoverSocket of existingModSockets) {
    const defaultMod = defs.InventoryItem.get(
      leftoverSocket.socketDefinition.singleInitialItemHash
    );
    const currentModEnergy = leftoverSocket.plugged?.plugDef.plug.energyCost?.energyCost || 0;
    optionalRegains.push({
      socketIndex: leftoverSocket.socketIndex,
      mod: defaultMod as PluggableInventoryItemDefinition,
      energySpend: -currentModEnergy,
      required: false,
    });
  }

  // sort lower gains first
  optionalRegains.sort(compareBy((res) => -res.energySpend));

  const operationSet: PluggingAction[] = [];

  const itemTotalEnergy = item.energy!.energyCapacity;
  let itemCurrentUsedEnergy = item.energy!.energyUsed;

  // apply all required regains first
  for (const regainOperation of requiredRegains) {
    operationSet.push(regainOperation);
    itemCurrentUsedEnergy += regainOperation.energySpend;
  }

  // keep looping til we have placed all desired mods
  for (const spendOperation of requiredSpends) {
    // while there's not enough energy for this mod,
    while (itemCurrentUsedEnergy + spendOperation.energySpend > itemTotalEnergy) {
      if (!optionalRegains.length) {
        throw new Error(
          `there's not enough energy to assign ${spendOperation.mod.displayProperties.name} to ${item.name}, but no more energy can be freed up`
        );
      }
      // we'll apply optional energy regains to make space
      const itemCurrentFreeEnergy = itemTotalEnergy - itemCurrentUsedEnergy;
      const extraEnergyNeeded = spendOperation.energySpend - itemCurrentFreeEnergy;

      const whichRegainToUse =
        optionalRegains.find((r) => -r.energySpend >= extraEnergyNeeded) ?? optionalRegains[0];

      // this is now required, because it helps place a required mod
      whichRegainToUse.required = true;
      // apply this regain
      operationSet.push(whichRegainToUse);
      // apply its energy change
      itemCurrentUsedEnergy += whichRegainToUse.energySpend;
      // and remove it from the optional regains list
      optionalRegains.splice(optionalRegains.indexOf(whichRegainToUse), 1);
    }

    // now we can apply this spend
    operationSet.push(spendOperation);
    // and apply its energy change
    itemCurrentUsedEnergy += spendOperation.energySpend;
  }

  // append any "reset to default"s that we didn't consume
  for (const regainOperation of optionalRegains) {
    operationSet.push(regainOperation);
  }
  return operationSet;
}

/**
 * input: a dictionary keyed by instanceId, of `{ socketIndex, mod|undefined}[]`
 *
 * output: a dictionary keyed by instanceId, of `mod[]`
 *
 * used to turn a collections of specific mod assignments,
 * into a socket-agnostic list
 */
export function compactModAssignments(assignments: {
  [itemInstanceId: string]: { socketIndex: number; mod: PluggableInventoryItemDefinition }[];
}): {
  [itemInstanceId: string]: PluggableInventoryItemDefinition[];
} {
  return _.mapValues(assignments, (assignmentsForItem) =>
    _.compact(assignmentsForItem.map((a) => a.mod))
  );
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

/** given conditions and assigned mods, can this mod be placed on this armor item? */
function isBucketSpecificModValid(
  defs: D2ManifestDefinitions,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  item: DimItem,
  mod: PluggableInventoryItemDefinition,
  /** mods that are already assigned to this item */
  assignedMods: PluggableInventoryItemDefinition[]
) {
  // given spending rules, what we can assume this item's energy is
  const itemEnergyCapacity = upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item);
  // given spending/element rules & current assignments, what element is this armor?
  const itemEnergyType = getItemEnergyType(
    defs,
    item,
    upgradeSpendTier,
    lockItemEnergyType,
    assignedMods
  );

  // how many armor energy points are already used
  const energyUsed = _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0);
  // cost of inserting this new proposed mod
  const modCost = mod.plug.energyCost?.energyCost || 0;
  // element of this new proposed mod
  const modEnergyType = mod.plug.energyCost?.energyType || DestinyEnergyType.Any;
  // is the proposed mod's element compatible with armor's element?
  const energyTypeIsValid = energyTypesAreCompatible(modEnergyType, itemEnergyType);

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
