import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, DimSockets, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { ArmorEnergyRules } from 'app/loadout-builder/types';
import { Assignment, PluggingAction } from 'app/loadout-drawer/loadout-types';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { ModSocketMetadata } from 'app/search/specialty-modslots';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { warnLog } from 'app/utils/log';
import {
  getSocketByIndex,
  getSocketsByCategoryHash,
  plugFitsIntoSocket,
} from 'app/utils/socket-utils';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { calculateAssumedItemEnergy } from './armor-upgrade-utils';
import { activityModPlugCategoryHashes } from './known-values';
import { generateModPermutations } from './mod-permutations';
import { plugCategoryHashToBucketHash } from './mod-utils';

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
 * Armor mods, split into general, combat, activity, and bucket-specific mods.
 */
export interface ModMap {
  allMods: PluggableInventoryItemDefinition[];
  bucketSpecificMods: { [bucketHash: number]: PluggableInventoryItemDefinition[] };
  generalMods: PluggableInventoryItemDefinition[];
  activityMods: PluggableInventoryItemDefinition[];
}

/**
 * Categorizes `allMods` into mod categories according to the `ModMap`. Pass a list of `referenceItems`
 * to eagerly filter out mods that can't fit into any of these items (`unassignedMods`), this is typically
 * needed in order to exclude deprecated (artifact) mods.
 */
export function categorizeArmorMods(
  allMods: PluggableInventoryItemDefinition[],
  referenceItems: DimItem[]
): { modMap: ModMap; unassignedMods: PluggableInventoryItemDefinition[] } {
  const generalMods: PluggableInventoryItemDefinition[] = [];
  const activityMods: PluggableInventoryItemDefinition[] = [];
  const bucketSpecificMods: { [plugCategoryHash: number]: PluggableInventoryItemDefinition[] } = {};

  const validMods: PluggableInventoryItemDefinition[] = [];
  const unassignedMods: PluggableInventoryItemDefinition[] = [];

  const allActiveModSockets = referenceItems
    .flatMap((i) => getSocketsByCategoryHash(i.sockets, SocketCategoryHashes.ArmorMods))
    .filter((socket) => socket.plugged);

  // Divide up the locked mods into general, combat and activity mod arrays, and put
  // bucket specific mods into a map keyed by bucket hash.
  for (const plannedMod of allMods) {
    const pch = plannedMod.plug.plugCategoryHash;
    if (!allActiveModSockets.some((s) => plugFitsIntoSocket(s, plannedMod.hash))) {
      // Eagerly reject mods that can't possibly fit into any socket at all under
      // any circumstances, such as deprecated (artifact) armor mods.
      // Mod assignment code relies on manually curated socket/plug metadata, so
      // it doesn't check whether a plug actually appears in the list of possible plugs.
      // Deprecated combat style armor mods in particular are indistinguishable from
      // non-deprecated ones by their definitions alone.
      unassignedMods.push(plannedMod);
    } else if (pch === armor2PlugCategoryHashesByName.general) {
      generalMods.push(plannedMod);
      validMods.push(plannedMod);
    } else if (activityModPlugCategoryHashes.includes(pch)) {
      activityMods.push(plannedMod);
      validMods.push(plannedMod);
    } else {
      const bucketHash = plugCategoryHashToBucketHash[pch];
      if (bucketHash !== undefined) {
        (bucketSpecificMods[bucketHash] ??= []).push(plannedMod);
        validMods.push(plannedMod);
      } else {
        unassignedMods.push(plannedMod);
      }
    }
  }

  return {
    modMap: {
      allMods: validMods,
      generalMods,
      activityMods,
      bucketSpecificMods,
    },
    unassignedMods,
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
  armorEnergyRules,
}: {
  /** a set (i.e. helmet, arms, etc) of items that we are trying to assign mods to */
  items: DimItem[];
  /** mods we are trying to place on the items */
  plannedMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
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

  const {
    modMap: { activityMods, generalMods, bucketSpecificMods },
    unassignedMods,
  } = categorizeArmorMods(plannedMods, items);

  for (const [bucketHash_, modsToAssign] of Object.entries(bucketSpecificMods)) {
    const bucketHash = Number(bucketHash_);
    const targetItem = items.find((item) => item.bucket.hash === bucketHash);

    if (targetItem) {
      bucketSpecificAssignments[targetItem.id] = assignBucketSpecificMods({
        armorEnergyRules,
        item: targetItem,
        modsToAssign,
      });
    } else {
      unassignedMods.push(...modsToAssign);
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
        armorEnergyRules,
      })
  );

  const generalModPermutations = generateModPermutations(generalMods);
  const activityModPermutations = generateModPermutations(activityMods);

  for (const activityPermutation of activityModPermutations) {
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
        totalActiveConditionalMods += calculateTotalActivatedModsScore(
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

  const itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  } = {};

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
 * Get active armor mod sockets and sort the sockets and mods for a greedy assignment strategy to succeed.
 */
function getArmorSocketsAndMods(
  sockets: DimSockets | null,
  mods: PluggableInventoryItemDefinition[]
) {
  const orderedSockets = getSocketsByCategoryHash(sockets, SocketCategoryHashes.ArmorMods)
    // If a socket is not plugged (even with an empty socket) we consider it disabled
    // This needs to be checked as the 30th anniversary armour has the Artifice socket
    // but the API considers it to be disabled.
    .filter((socket) => socket.plugged)
    // Artificer sockets only plug a subset of the bucket specific mods so we sort by the size
    // of the plugItems in the plugset so we use that first if possible. This is optional and
    // simply prefers plugging artifact mods into artifice sockets if available.
    .sort(compareBy((socket) => (socket.plugSet ? socket.plugSet.plugs.length : 999)));

  // Order the mods themselves based on how many sockets they could fit into,
  // inserting the more picky mods first. This is necessary because we
  // want to honor user choice with mod sockets, but need to move some mods if
  // necessary. Consider the following scenario:
  // * Artifice chestpiece has two artifact resist mods in the normal sockets
  // * mods are [artifact resist, artifact resist, normal resist]
  // Naively inserting those mods finds the artifact mods in their position,
  // but the artifact-only socket can't slot the normal resist mod. Thus,
  // we must assign the regular resist mod first.
  const orderedMods = _.sortBy(
    mods,
    (mod) => orderedSockets.filter((s) => plugFitsIntoSocket(s, mod.hash)).length
  );

  return { orderedSockets, orderedMods };
}

/**
 * Assign bucket specific mods based on assumed energy type, assumed mod energy capacity, and available sockets,
 * partitioning mods based whether it could fit them into the item.
 * Socket choice for mod assignment is greedy, but uses a heuristic based on the number of sockets a mod could
 * fit into, since mods that can fit into fewer sockets must be prioritized.
 */
export function assignBucketSpecificMods({
  item,
  armorEnergyRules,
  modsToAssign,
}: {
  armorEnergyRules: ArmorEnergyRules;
  item: DimItem;
  modsToAssign: PluggableInventoryItemDefinition[];
}): {
  assigned: PluggableInventoryItemDefinition[];
  unassigned: PluggableInventoryItemDefinition[];
} {
  // given spending rules, what we can assume this item's energy is
  let itemEnergyCapacity = calculateAssumedItemEnergy(item, armorEnergyRules);

  const { orderedSockets, orderedMods } = getArmorSocketsAndMods(item.sockets, modsToAssign);

  const assigned = [];
  const unassigned = [];

  for (const mod of orderedMods) {
    const socketIndex = orderedSockets.findIndex((socket) => plugFitsIntoSocket(socket, mod.hash));
    if (socketIndex === -1) {
      // We don't have a socket to fit this mod into
      unassigned.push(mod);
      continue;
    }

    // cost of inserting this new proposed mod
    const modCost = mod.plug.energyCost?.energyCost || 0;

    if (modCost > itemEnergyCapacity) {
      // The mod is incompatible with the item or the existing mods we have already assigned
      unassigned.push(mod);
      continue;
    }

    assigned.push(mod);
    itemEnergyCapacity -= modCost;
    orderedSockets.splice(socketIndex, 1);
  }

  return { assigned, unassigned };
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

  const { orderedSockets, orderedMods } = getArmorSocketsAndMods(item.sockets, modsToInsert);

  for (const modToInsert of orderedMods) {
    // If this mod is already plugged somewhere, that's the slot we want to keep it in
    let destinationSocketIndex = orderedSockets.findIndex(
      (socket) => socket.plugged?.plugDef.hash === modToInsert.hash
    );

    // If it wasn't found already plugged, find the first socket with a matching PCH
    if (destinationSocketIndex === -1) {
      destinationSocketIndex = orderedSockets.findIndex((socket) =>
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
    const destinationSocket = orderedSockets[destinationSocketIndex];

    assignments.push({
      socketIndex: destinationSocket.socketIndex,
      mod: modToInsert,
      requested: true,
    });

    // remove this existing socket from consideration
    orderedSockets.splice(destinationSocketIndex, 1);
  }

  // For each remaining armor mod socket that won't have mods assigned,
  // allow it to be returned to its default (usually "Empty Mod Socket").
  for (const socket of orderedSockets) {
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
 * Artifice armor may not be accurate unless you pass in defs.
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

/**
 * A cost heuristic for upgrading armor.
 */
function calculateEnergyChange(
  itemEnergy: ItemEnergy,
  assignedMods: PluggableInventoryItemDefinition[]
) {
  const modCost =
    itemEnergy.used + _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0);

  // Otherwise check how many levels of upgrade we need
  return Math.max(0, modCost - itemEnergy.originalCapacity);
}

/**
 * Calculates the total number of active conditional mods on the item.
 * Used to ensure mod assignments favor results that activate these mods.
 */
function calculateTotalActivatedModsScore(
  bucketSpecificAssignments: PluggableInventoryItemDefinition[],
  bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[],
  allAssignedMods: PluggableInventoryItemDefinition[]
) {
  let activeModsScore = 0;

  for (const mod of bucketIndependentAssignmentsForItem) {
    activeModsScore += plugActivationScore(
      mod,
      bucketSpecificAssignments,
      bucketIndependentAssignmentsForItem,
      allAssignedMods
    );
  }

  return activeModsScore;
}

/**
 * Determines whether a mod has had its requirements met by the other mods. Right now this is used
 * to score statful Charged With Light mods (powerful friends, radiant light is activated) and other
 * CWL mods with conditionally active perks.
 */
function plugActivationScore(
  _mod: PluggableInventoryItemDefinition,
  _bucketSpecificAssignments: PluggableInventoryItemDefinition[],
  _bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[],
  _allMods: PluggableInventoryItemDefinition[]
) {
  // FIXME(Lightfall): Are there still "combo" mods?
  return 0;
}

function buildItemEnergy({
  item,
  assignedMods,
  armorEnergyRules,
}: {
  item: DimItem;
  assignedMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
}): ItemEnergy {
  return {
    used: _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0),
    originalCapacity: item.energy?.energyCapacity || 0,
    derivedCapacity: calculateAssumedItemEnergy(item, armorEnergyRules),
    isClassItem: item.bucket.hash === BucketHashes.ClassArmor,
  };
}

interface ItemEnergy {
  used: number;
  originalCapacity: number;
  derivedCapacity: number;
  isClassItem: boolean;
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
  const assignedModsCost = _.sumBy(assignedMods, (mod) => mod?.plug.energyCost?.energyCost || 0);

  return itemEnergy.used + modToAssignCost + assignedModsCost <= itemEnergy.derivedCapacity;
}

function isAssigningToDefault(item: DimItem, assignment: Assignment) {
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
