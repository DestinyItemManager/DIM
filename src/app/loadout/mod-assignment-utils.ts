import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Assignment, PluggingAction } from 'app/loadout-drawer/loadout-types';
import {
  armor2PlugCategoryHashesByName,
  modsWithConditionalStats,
} from 'app/search/d2-known-values';
import {
  combatCompatiblePlugCategoryHashes,
  ModSocketMetadata,
  modTypeTagByPlugCategoryHash,
} from 'app/search/specialty-modslots';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { warnLog } from 'app/utils/log';
import {
  getSocketByIndex,
  getSocketsByCategoryHash,
  plugFitsIntoSocket,
} from 'app/utils/socket-utils';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { calculateAssumedItemEnergy } from './armor-upgrade-utils';
import { generateModPermutations } from './mod-permutations';
import {
  activityModPlugCategoryHashes,
  bucketHashToPlugCategoryHash,
  getItemEnergyType,
} from './mod-utils';

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
 * Given a set of items and desired mods, this checks permutations to get as many assigned as possible.
 *
 * It considers item mods slots, item energy, and user willingness to upgrade,
 * and uses the idea of total energy spent and wasted to rank mod assignments.
 *
 * To do this we create permutations of general, combat and activity mods and loop over each
 * set of permutations and validate the combination. Validate is done via a lower number of
 * unassigned mods or an equal amount of unassigned mods and a lower energy cost.
 *
 * This returns a list of `unassignedMods` it was unable to find places for,
 * and `itemModAssignments`, an item ID-keyed dictionary of
 * - bucket specific (gauntlets-only, etc), and
 * - bucket independent (intellect mod, charged w/ light, etc)
 */
export function fitMostMods({
  items,
  plannedMods,
  assumeArmorMasterwork,
  lockArmorEnergyType,
  minItemEnergy,
}: {
  /** a set (i.e. helmet, arms, etc) of items that we are trying to assign mods to */
  items: DimItem[];
  /** mods we are trying to place on the items */
  plannedMods: PluggableInventoryItemDefinition[];
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  minItemEnergy: number;
}): {
  itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  };
  unassignedMods: PluggableInventoryItemDefinition[];
} {
  let bucketIndependentAssignments: ModAssignments = {};
  const bucketSpecificAssignments: ModAssignments = {};

  // just an arbitrarily large number
  // The total cost to assign all the mods to a set
  // this includes energy used to upgrade and energy wasted on changing elements
  let assignmentEnergyCost = Number.MAX_SAFE_INTEGER;
  // The total number of mods that couldn't be assigned to the items
  let assignmentUnassignedModCount = Number.MAX_SAFE_INTEGER;
  // The total number of conditional mods that are activated in the assignment
  let assignmentActiveConditionalMods = Number.MIN_SAFE_INTEGER;
  // The total number of bucket independent mods that are changed in the assignment
  let assignmentModChangeCount = Number.MAX_SAFE_INTEGER;

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
        (item) =>
          plannedMod.plug.plugCategoryHash === bucketHashToPlugCategoryHash[item.bucket.hash]
      );

      if (targetItem) {
        if (
          isBucketSpecificModValid({
            assumeArmorMasterwork,
            lockArmorEnergyType,
            minItemEnergy,
            item: targetItem,
            mod: plannedMod,
            assignedMods: bucketSpecificAssignments[targetItem.id].assigned,
          })
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
      buildItemEnergy({
        item,
        assignedMods: bucketSpecificAssignments[item.id].assigned,
        assumeArmorMasterwork,
        lockArmorEnergyType,
        minItemEnergy,
      })
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
        // Skip further checks if we have more unassigned mods in this assignment
        if (unassignedModCount > assignmentUnassignedModCount) {
          continue;
        }

        let totalActiveConditionalMods = 0;
        const allAssignedMods = Object.values(assignments).flatMap(
          (assignment) => assignment.assigned
        );
        for (const item of items) {
          totalActiveConditionalMods += calculateTotalActivatedMods(
            bucketSpecificAssignments[item.id].assigned,
            assignments[item.id].assigned,
            allAssignedMods
          );
        }

        // Skip further checks if we have less active condition mods and we have an equal amount
        // of unassigned mods. If we have less unassigned mods we should continue because its a better
        // assignment
        if (
          unassignedModCount === assignmentUnassignedModCount &&
          totalActiveConditionalMods < assignmentActiveConditionalMods
        ) {
          continue;
        }

        let energyUsedAndWasted = 0;
        for (const [itemId, { assigned }] of Object.entries(assignments)) {
          energyUsedAndWasted += calculateEnergyChange(itemEnergies[itemId], assigned);
        }

        // Skip further checks if we are spending more energy that we were previously.
        if (
          unassignedModCount === assignmentUnassignedModCount &&
          totalActiveConditionalMods === assignmentActiveConditionalMods &&
          energyUsedAndWasted > assignmentEnergyCost
        ) {
          continue;
        }

        let modChangeCount = 0;
        for (const item of items) {
          modChangeCount += countBucketIndependentModChangesForItem(
            item,
            assignments[item.id].assigned
          );
        }

        // One of the following three conditions needs to be true for the assignment to be better
        if (
          // Less unassigned mods
          unassignedModCount < assignmentUnassignedModCount ||
          // The same amount of unassigned mods and more active conditional mods
          (unassignedModCount === assignmentUnassignedModCount &&
            totalActiveConditionalMods > assignmentActiveConditionalMods) ||
          // The same amount of unassigned and active mods but the assignment is cheaper
          (unassignedModCount === assignmentUnassignedModCount &&
            totalActiveConditionalMods === assignmentActiveConditionalMods &&
            energyUsedAndWasted < assignmentEnergyCost) ||
          // The assignment costs the same but we are changing fewer mods
          (unassignedModCount === assignmentUnassignedModCount &&
            totalActiveConditionalMods === assignmentActiveConditionalMods &&
            energyUsedAndWasted === assignmentEnergyCost &&
            modChangeCount < assignmentModChangeCount)
        ) {
          // We save this assignment and its metadata because it is determined to be better
          bucketIndependentAssignments = assignments;
          assignmentEnergyCost = energyUsedAndWasted;
          assignmentUnassignedModCount = unassignedModCount;
          assignmentActiveConditionalMods = totalActiveConditionalMods;
          assignmentModChangeCount = modChangeCount;
        }
      }
    }
  }

  const itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  } = {};

  const unassignedMods: PluggableInventoryItemDefinition[] = [];
  for (const item of items) {
    // accumulate all unassigned mods
    for (const collection of [
      bucketIndependentAssignments[item.id],
      bucketSpecificAssignments[item.id],
    ]) {
      for (const mod of collection.unassigned) {
        unassignedMods.push(mod);
      }
    }
    const bucketIndependent = bucketIndependentAssignments[item.id].assigned;
    const bucketSpecific = bucketSpecificAssignments[item.id].assigned;
    itemModAssignments[item.id] = [...bucketIndependent, ...bucketSpecific];
  }

  return { itemModAssignments, unassignedMods };
}

/**
 * For a given item, and mods that need attaching,
 * this creates a list of assignments which prefer plugging
 * desired mod X into a slot that already has X
 *
 * THIS ASSUMES THE SUPPLIED ASSIGNMENTS ARE POSSIBLE,
 * on this item, with its specific mod slots, and will throw if they are not.
 * "which/how many mods will fit" is `fitMostMods`'s job, and this consumes its output
 *
 * This also only works on armor mods, not cosmetics/fashion
 */
export function pickPlugPositions(
  defs: D2ManifestDefinitions,
  item: DimItem,
  modsToInsert: PluggableInventoryItemDefinition[],
  /** if an item has mods applied, this will "clear" all other sockets to empty/their default */
  clearUnassignedSocketsPerItem = false
): Assignment[] {
  const assignments: Assignment[] = [];

  if (!item.sockets) {
    return assignments;
  }
  const existingModSockets = getSocketsByCategoryHash(
    item.sockets,
    SocketCategoryHashes.ArmorMods
  ).sort(
    // We are sorting so that we can assign mods to the socket with the least number of possible options
    // first. This helps with artificer mods as the socket is a subset of the other mod sockets on the item
    compareBy((socket) => (socket.plugSet ? socket.plugSet.plugs.length : 999))
  );

  for (const modToInsert of modsToInsert) {
    // If this mod is already plugged somewhere, that's the slot we want to keep it in
    let destinationSocketIndex = existingModSockets.findIndex(
      (socket) => socket.plugged?.plugDef.hash === modToInsert.hash
    );

    // If it wasn't found already plugged, find the first socket with a matching PCH
    // TO-DO: this is naive and is going to be misleading for armor
    if (destinationSocketIndex === -1) {
      destinationSocketIndex = existingModSockets.findIndex((socket) =>
        plugFitsIntoSocket(socket, modToInsert.hash)
      );
    }

    // If a destination socket couldn't be found for this plug, something is seriously? wrong
    if (destinationSocketIndex === -1) {
      throw new Error(
        `We couldn't find anywhere to plug the mod ${modToInsert.displayProperties.name} (${modToInsert.hash})`
      );
    }

    // we found it!! this is where we have chosen to place the mod
    const destinationSocket = existingModSockets[destinationSocketIndex];

    assignments.push({
      socketIndex: destinationSocket.socketIndex,
      mod: modToInsert,
      requested: true,
    });

    // remove this existing socket from consideration
    existingModSockets.splice(destinationSocketIndex, 1);
  }

  // For each remaining armor mod socket that won't have mods assigned,
  // allow it to be returned to its default (usually "Empty Mod Socket").
  for (const socket of existingModSockets) {
    const defaultModHash = socket.emptyPlugItemHash;
    const mod =
      defaultModHash &&
      (defs.InventoryItem.get(defaultModHash) as PluggableInventoryItemDefinition);

    if (mod) {
      const { socketIndex } = socket;
      assignments.push({
        socketIndex,
        mod,
        // If the user wants to clear out all items, this is requested. Otherwise it's optional.
        requested: clearUnassignedSocketsPerItem,
      });
    }
  }

  return assignments;
}

/**
 * For a given item, set of assignments (where to plug what),
 * this creates an ordered list of plugging actions, which:
 * - remove or swap in cheaper mods to free up enough armor energy, before applying mods which cost more
 * - mark mod removals as optional, if they aren't required to free up a slot or energy
 *
 * THIS ASSUMES THE SUPPLIED ASSIGNMENTS ARE POSSIBLE,
 * on this item, with its specific mod slots, and will throw if they are not.
 * This consumes the output of `pickPlugPositions` and just orders & adds metadata
 */
export function createPluggingStrategy(item: DimItem, assignments: Assignment[]): PluggingAction[] {
  // stuff we need to apply, that frees up energy. we'll apply these first
  const requiredRegains: PluggingAction[] = [];
  // stuff we need to apply, but it will cost us...
  const requiredSpends: PluggingAction[] = [];
  // stuff we MAY apply, if we need more energy freed up
  const optionalRegains: PluggingAction[] = [];

  if (!item.energy) {
    return emptyArray();
  }

  for (const assignment of assignments) {
    const destinationSocket = getSocketByIndex(item.sockets!, assignment.socketIndex)!;
    const existingModCost = destinationSocket.plugged?.plugDef.plug.energyCost?.energyCost || 0;
    const plannedModCost = assignment.mod.plug.energyCost?.energyCost || 0;
    const energySpend = plannedModCost - existingModCost;

    const pluggingAction = {
      ...assignment,
      energySpend,
      required: assignment.requested,
    };

    if (pluggingAction.energySpend > 0) {
      requiredSpends.push(pluggingAction);
    } else if (!pluggingAction.required && isAssigningToDefault(item, assignment)) {
      optionalRegains.push(pluggingAction);
    } else {
      requiredRegains.push(pluggingAction);
    }
  }

  // sort lower gains first, but put zero gains at the end. Otherwise the zero
  // gains will be used as part of "adding up" to make the energy needed
  optionalRegains.sort(
    compareBy((res) => (res.energySpend < 0 ? -res.energySpend : Number.MAX_VALUE))
  );

  const operationSet: PluggingAction[] = [];

  const itemTotalEnergy = item.energy.energyCapacity;
  let itemCurrentUsedEnergy = item.energy.energyUsed;

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
  operationSet.push(...optionalRegains);
  return operationSet;
}
/** given conditions and assigned mods, can this mod be placed on this armor item? */
function isBucketSpecificModValid({
  assumeArmorMasterwork,
  lockArmorEnergyType,
  minItemEnergy,
  item,
  mod,
  assignedMods,
}: {
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  minItemEnergy: number;
  item: DimItem;
  mod: PluggableInventoryItemDefinition;
  /** mods that are already assigned to this item */
  assignedMods: PluggableInventoryItemDefinition[];
}) {
  // given spending rules, what we can assume this item's energy is
  const itemEnergyCapacity = calculateAssumedItemEnergy(item, assumeArmorMasterwork, minItemEnergy);
  // given spending/element rules & current assignments, what element is this armor?
  const itemEnergyType = getItemEnergyType(item, lockArmorEnergyType, assignedMods);

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

  return (
    isModEnergyValid(itemEnergy, combatMod, ...assignedMods) &&
    modTag &&
    itemSocketMetadata?.some((metadata) => metadata.compatibleModTags.includes(modTag))
  );
}

/**
 * Calculates the energy needed to be bought to assign the given mods.
 *
 * For example
 * - if an item needs to be upgraded to fit the mod in, it will be the number of energy levels the user
 * buys
 * - if an items energy element needs to be changed, it will be the energy needed for the mods plus
 * energy the item originally had (the energy wasted).
 */
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
 * Calculates the total number of active conditional mods on the item.
 * Used to ensure mod assignments favor results that activate these mods.
 */
function calculateTotalActivatedMods(
  bucketSpecificAssignments: PluggableInventoryItemDefinition[],
  bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[],
  allAssignedMods: PluggableInventoryItemDefinition[]
) {
  let activeMods = 0;

  for (const mod of bucketIndependentAssignmentsForItem) {
    if (
      isPlugActive(
        mod,
        bucketSpecificAssignments,
        bucketIndependentAssignmentsForItem,
        allAssignedMods
      )
    ) {
      activeMods++;
    }
  }

  return activeMods;
}

/**
 * Determines whether a conditional mod has had its requirements met by the other mods.
 * Currently only used for radiant light and powerful friends
 */
function isPlugActive(
  mod: PluggableInventoryItemDefinition,
  bucketSpecificAssignments: PluggableInventoryItemDefinition[],
  bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[],
  allMods: PluggableInventoryItemDefinition[]
) {
  if (
    mod.hash === modsWithConditionalStats.powerfulFriends ||
    mod.hash === modsWithConditionalStats.radiantLight
  ) {
    // True if a second arc mod is socketed or a arc charged with light mod  is found in modsOnOtherItems.
    return Boolean(
      bucketSpecificAssignments.some(
        (m) => m.hash !== mod.hash && m.plug.energyCost?.energyType === DestinyEnergyType.Arc
      ) ||
      bucketIndependentAssignmentsForItem.some(
        (m) => m.hash !== mod.hash && m.plug.energyCost?.energyType === DestinyEnergyType.Arc
      ) ||
      allMods?.some(
        (plugDef) =>
          plugDef !== mod &&
          modTypeTagByPlugCategoryHash[plugDef.plug.plugCategoryHash] === 'chargedwithlight' &&
          plugDef.plug.energyCost?.energyType === DestinyEnergyType.Arc
      )
    );
  }
}

function buildItemEnergy({
  item,
  assignedMods,
  assumeArmorMasterwork,
  lockArmorEnergyType,
  minItemEnergy,
}: {
  item: DimItem;
  assignedMods: PluggableInventoryItemDefinition[];
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  minItemEnergy: number;
}): ItemEnergy {
  return {
    used: _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0),
    originalCapacity: item.energy?.energyCapacity || 0,
    derivedCapacity: calculateAssumedItemEnergy(item, assumeArmorMasterwork, minItemEnergy),
    originalType: item.energy?.energyType || DestinyEnergyType.Any,
    derivedType: getItemEnergyType(item, lockArmorEnergyType, assignedMods),
  };
}

interface ItemEnergy {
  used: number;
  originalCapacity: number;
  derivedCapacity: number;
  originalType: DestinyEnergyType;
  derivedType: DestinyEnergyType;
}
/**
 * Validates whether a mod can be assigned to an item in the mod assignments algorithm.
 *
 * This checks that the summed mod energies are within the derived mod capacity for
 * an item (derived from armour upgrade options). It also ensures that all the mod
 * energy types align and that the mod can be slotted into an item socket based on
 * item energy type.
 */
function isModEnergyValid(
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

export function isAssigningToDefault(item: DimItem, assignment: Assignment) {
  const socket = item.sockets && getSocketByIndex(item.sockets, assignment.socketIndex);
  if (!socket) {
    warnLog(
      'loadout mods',
      'Why does socket',
      assignment.socketIndex,
      'not exist on',
      item.name,
      item.hash
    );
  }
  return socket && assignment.mod.hash === socket.emptyPlugItemHash;
}

/**
 * This counts the number of bucket independent mods that are already plugged into an item.
 *
 * Because there is only a single, general, combat, and activity mod socket on each item
 * it is sufficient to just check that each mod is socketed somewhere within the armor mod
 * sockets.
 */
function countBucketIndependentModChangesForItem(
  item: DimItem,
  bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[]
) {
  let count = 0;

  for (const mod of bucketIndependentAssignmentsForItem) {
    const socketsThatWillFitMod = getSocketsByCategoryHash(
      item.sockets,
      SocketCategoryHashes.ArmorMods
    );
    if (socketsThatWillFitMod.some((socket) => socket.plugged?.plugDef.hash === mod.hash)) {
      continue;
    } else {
      count += 1;
    }
  }

  return count;
}
