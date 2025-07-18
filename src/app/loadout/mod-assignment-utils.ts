import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, DimSockets, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getEnergyUpgradePlugs } from 'app/inventory/store/energy';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { ArmorEnergyRules } from 'app/loadout-builder/types';
import { Assignment, PluggingAction } from 'app/loadout/loadout-types';
import {
  ItemRarityName,
  armor2PlugCategoryHashesByName,
  maxEnergyCapacity,
} from 'app/search/d2-known-values';
import { ModSocketMetadata } from 'app/search/specialty-modslots';
import { count, mapValues, sumBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
  isArtifice,
} from 'app/utils/item-utils';
import { warnLog } from 'app/utils/log';
import {
  getSocketByIndex,
  getSocketsByCategoryHash,
  plugFitsIntoSocket,
} from 'app/utils/socket-utils';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { keyBy } from 'es-toolkit';
import memoizeOne from 'memoize-one';
import { calculateAssumedItemEnergy, isAssumedArtifice } from './armor-upgrade-utils';
import { activityModPlugCategoryHashes } from './known-values';
import { generateModPermutations } from './mod-permutations';
import { getModExclusionGroup, plugCategoryHashToBucketHash } from './mod-utils';

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
  /** Flat copy of all the mods below */
  allMods: PluggableInventoryItemDefinition[];
  /** Mods that always go into armor pieces of a given slot */
  bucketSpecificMods: { [bucketHash: number]: PluggableInventoryItemDefinition[] };
  /** General mods, mostly the +5 and +10 stat mods */
  generalMods: PluggableInventoryItemDefinition[];
  /** Activity mods like raid or nightmare mods */
  activityMods: PluggableInventoryItemDefinition[];
  /**
   * Master dungeon artifice mods granting a +3 to a stat.
   * Theoretically these could be modeled as activity mods but
   * that's unlikely to be useful since artifice mods are free
   * so there's no permutation checking involved; and we probably
   * also don't want to ever pass these to the Loadout Optimizer process.
   */
  artificeMods: PluggableInventoryItemDefinition[];
}

/**
 * Categorizes `allMods` into mod categories according to the `ModMap`. Pass a list of `referenceItems`
 * to eagerly filter out mods that can't fit into any of these items (`unassignedMods`), this is typically
 * needed in order to exclude deprecated (artifact) mods.
 */
export function categorizeArmorMods(
  allMods: PluggableInventoryItemDefinition[],
  referenceItems: DimItem[],
): { modMap: ModMap; unassignedMods: PluggableInventoryItemDefinition[] } {
  const generalMods: PluggableInventoryItemDefinition[] = [];
  const activityMods: PluggableInventoryItemDefinition[] = [];
  const artificeMods: PluggableInventoryItemDefinition[] = [];
  const bucketSpecificMods: { [plugCategoryHash: number]: PluggableInventoryItemDefinition[] } = {};

  const validMods: PluggableInventoryItemDefinition[] = [];
  const unassignedMods: PluggableInventoryItemDefinition[] = [];

  const allActiveModSockets = referenceItems
    .flatMap((i) => getSocketsByCategoryHash(i.sockets, SocketCategoryHashes.ArmorMods))
    .filter((socket) => socket.plugged);

  // Divide up the locked mods into general, combat and activity mod arrays, and put
  // bucket specific mods into a map keyed by bucket hash.
  for (const plannedMod of allMods) {
    const pch = plannedMod.plug.plugCategoryHash as PlugCategoryHashes;
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
    } else if (plannedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice) {
      artificeMods.push(plannedMod);
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
      artificeMods,
      bucketSpecificMods,
    },
    unassignedMods,
  };
}

const materialsInRarityOrder = [
  3467984096, // InventoryItem "Exotic Cipher"
  4257549985, // InventoryItem "Ascendant Shard"
  4257549984, // InventoryItem "Enhancement Prism"
  3853748946, // InventoryItem "Enhancement Core"
  3159615086, // InventoryItem "Glimmer"
];

/** Armor 2.0 Exotics can be enhanced to artifice armor after reaching T10, which costs a bunch of stuff */
const upgradeToArtificePlug = 720825311; // Upgrade to Artifice Armor

/**
 * Upgrading the energy capacity of an item costs materials. However, exotics cost more than legendaries,
 * and higher tiers cost more than lower tiers. So we want to find an assignment that minimizes the global
 * costs across all items. This cost model defines a total order over the possible materials that could be spent.
 *
 * Currently this is a lexicographic comparison of material amounts by rarity: Something that costs
 * two ascendant shards is always more costly than something that only costs one. If the ascendant shard cost
 * is the same, then we count how many prisms are spent etc.
 */
function getUpgradeCost(
  model: EnergyUpgradeCostModel,
  item: ItemEnergy,
  dimItem: DimItem,
  newEnergy: number,
  needsArtifice: boolean,
) {
  const maxEnergy = maxEnergyCapacity(dimItem);
  if (!model.byRarity[item.rarity]) {
    const plugs = getEnergyUpgradePlugs(dimItem);
    const costsPerTier = Array<number[]>(maxEnergy);
    for (let i = 0; i <= maxEnergy; i++) {
      const previousTierCosts = costsPerTier[i - 1];
      costsPerTier[i] = previousTierCosts
        ? [...previousTierCosts]
        : Array<number>(materialsInRarityOrder.length).fill(0);
      const plug = plugs.find((plug) => plug.plug.energyCapacity!.capacityValue === i);
      if (!plug) {
        continue;
      }
      const materials = model.defs.MaterialRequirementSet.get(
        plug.plug.insertionMaterialRequirementHash,
      );
      for (const material of materials.materials) {
        const idx = materialsInRarityOrder.findIndex((mat) => mat === material.itemHash);
        if (idx !== -1) {
          costsPerTier[i][idx] += material.count;
        }
      }
    }
    model.byRarity[dimItem.rarity] = costsPerTier;
  }
  const needsEnhancing = item.rarity === 'Exotic' && needsArtifice && !isArtifice(dimItem);
  const targetEnergy = needsEnhancing ? maxEnergy : newEnergy;
  const rarityModel = model.byRarity[dimItem.rarity]!;
  const alreadyPaidCosts = rarityModel[item.originalCapacity];

  const costs = rarityModel[targetEnergy]?.map((val, idx) => val - alreadyPaidCosts[idx]) ?? [];
  if (needsEnhancing && model.exoticArtificeCosts) {
    for (let i = 0; i < costs.length; i++) {
      costs[i] += model.exoticArtificeCosts[i];
    }
  }
  return costs;
}

/**
 * This upgrade cost model isn't exactly cheap to compute, so we'd rather do it only once.
 * We know that all items of a given rarity have the same costs for the same capacity tier,
 * so we just compute it on-demand, once.
 */
interface EnergyUpgradeCostModel {
  defs: D2ManifestDefinitions;
  /** Cumulative costs to reach the indexed capacity. Subtract the costs for current capacity. */
  byRarity: { [rarity in ItemRarityName]?: number[][] };
  exoticArtificeCosts?: number[];
}

function getExoticArtificeCosts(defs: D2ManifestDefinitions): number[] | undefined {
  const plug = defs.InventoryItem.get(upgradeToArtificePlug);
  if (!plug || !isPluggableItem(plug)) {
    return undefined;
  }

  const costs = defs.MaterialRequirementSet.get(plug.plug.insertionMaterialRequirementHash);
  if (costs) {
    return materialsInRarityOrder.map(
      (hash) => costs.materials.find((m) => m.itemHash === hash)?.count ?? 0,
    );
  }
  return undefined;
}

/**
 * The memoization ensures that even as LO runs this for all rendered sets,
 * we don't end up rediscovering all the costs.
 */
const createUpgradeCostModel = memoizeOne(
  (defs: D2ManifestDefinitions): EnergyUpgradeCostModel => ({
    defs,
    byRarity: {},
    exoticArtificeCosts: getExoticArtificeCosts(defs),
  }),
);

/**
 * Lexicographic array comparison.
 */
function compareCosts(a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      return -1;
    } else if (a[i] > b[i]) {
      return 1;
    }
  }
  return 0;
}

/**
 * Given a set of items and desired mods, this checks permutations to get as many assigned as possible.
 *
 * It considers item mods slots, item energy, and user willingness to upgrade,
 * and uses the idea of total energy upgrade cost.
 *
 * To do this we create permutations of general, combat and activity mods and loop over each
 * set of permutations and validate the combination. Validate is done via a lower number of
 * unassigned mods or an equal amount of unassigned mods and a lower upgrade cost.
 *
 * This returns a list of `unassignedMods` it was unable to find places for,
 * and `itemModAssignments`, an item ID-keyed dictionary of
 * - bucket specific (gauntlets-only, etc), and
 * - bucket independent (intellect mod, charged w/ light, etc)
 */
export function fitMostMods({
  defs,
  items,
  plannedMods,
  armorEnergyRules,
}: {
  defs: D2ManifestDefinitions;
  /** a set (i.e. helmet, arms, etc) of items that we are trying to assign mods to */
  items: DimItem[];
  /** mods we are trying to place on the items */
  plannedMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
}): {
  itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  };
  resultingItemEnergies: {
    [itemInstanceId: string]: { energyCapacity: number; energyUsed: number };
  };
  unassignedMods: PluggableInventoryItemDefinition[];
  invalidMods: PluggableInventoryItemDefinition[];
  upgradeCosts: { materialHash: number; amount: number }[];
} {
  let bucketIndependentAssignments: ModAssignments = {};
  const bucketSpecificAssignments: ModAssignments = {};

  // just an arbitrarily large number
  // The total cost to upgrade armor to assign all the mods to a set
  let assignmentUpgradeCost: number[] = Array<number>(materialsInRarityOrder.length).fill(
    Number.MAX_SAFE_INTEGER,
  );
  // The total number of mods that couldn't be assigned to the items
  let assignmentUnassignedModCount = Number.MAX_SAFE_INTEGER;
  // The total number of bucket independent mods that are changed in the assignment
  let assignmentModChangeCount = Number.MAX_SAFE_INTEGER;

  const upgradeCostModel = createUpgradeCostModel(defs);

  for (const item of items) {
    bucketSpecificAssignments[item.id] = { assigned: [], unassigned: [] };
    bucketIndependentAssignments[item.id] = { assigned: [], unassigned: [] };
  }

  // An object of item id's to specialty socket metadata, this is used to ensure that
  // combat and activity mods can be slotted into an item.
  const itemSocketMetadata = mapValues(
    keyBy(items, (item) => item.id),
    (item) => getSpecialtySocketMetadatas(item),
  );

  const {
    modMap: { activityMods, generalMods, artificeMods, bucketSpecificMods },
    unassignedMods: invalidMods,
  } = categorizeArmorMods(plannedMods, items);

  const unassignedMods: PluggableInventoryItemDefinition[] = [];

  for (const [bucketHash_, modsToAssign] of Object.entries(bucketSpecificMods)) {
    const bucketHash = Number(bucketHash_);
    const targetItem = items.find((item) => item.bucket.hash === bucketHash);

    if (targetItem) {
      bucketSpecificAssignments[targetItem.id] = assignBucketSpecificMods(
        armorEnergyRules,
        targetItem,
        modsToAssign,
      );
    } else {
      unassignedMods.push(...modsToAssign);
    }
  }

  // Artifice mods are free and thus can be greedily assigned.
  const artificeItems = items.filter((i) => isAssumedArtifice(i, armorEnergyRules));
  for (const artificeMod of artificeMods) {
    let targetItemIndex = artificeItems.findIndex((item) =>
      item.sockets?.allSockets.some((socket) => socket.plugged?.plugDef.hash === artificeMod.hash),
    );
    if (targetItemIndex === -1 && artificeItems.length) {
      // Prefer plugging into non-exotic pieces since exotics may need costly upgrading
      targetItemIndex = artificeItems.findIndex((i) => !i.isExotic);
      if (targetItemIndex === -1) {
        // Otherwise use any
        targetItemIndex = 0;
      }
    }

    if (targetItemIndex !== -1) {
      bucketSpecificAssignments[artificeItems[targetItemIndex].id].assigned.push(artificeMod);
      artificeItems.splice(targetItemIndex, 1);
    } else {
      unassignedMods.push(artificeMod);
    }
  }

  // A object of item id's to energy information. This is so we can precalculate
  // working energy used, capacity and type and use this to validate whether a mod
  // can be used in an item.
  const itemEnergies = mapValues(
    keyBy(items, (item) => item.id),
    (item) =>
      buildItemEnergy({
        item,
        assignedMods: bucketSpecificAssignments[item.id].assigned,
        armorEnergyRules,
      }),
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

      const energyUpgradeCost = calculateUpgradeCost(
        items,
        itemEnergies,
        assignments,
        bucketSpecificAssignments,
        upgradeCostModel,
      );
      const upgradeCostsResult = compareCosts(energyUpgradeCost, assignmentUpgradeCost);

      // Skip further checks if we are spending more materials that we were previously.
      if (unassignedModCount === assignmentUnassignedModCount && upgradeCostsResult > 0) {
        continue;
      }

      let modChangeCount = 0;
      for (const item of items) {
        modChangeCount += countBucketIndependentModChangesForItem(
          item,
          assignments[item.id].assigned,
        );
      }

      // One of the following three conditions needs to be true for the assignment to be better
      if (
        // Less unassigned mods
        unassignedModCount < assignmentUnassignedModCount ||
        // The same amount of unassigned mods but the assignment is cheaper
        (unassignedModCount === assignmentUnassignedModCount && upgradeCostsResult < 0) ||
        // The assignment costs the same but we are changing fewer mods
        (unassignedModCount === assignmentUnassignedModCount &&
          upgradeCostsResult === 0 &&
          modChangeCount < assignmentModChangeCount)
      ) {
        // We save this assignment and its metadata because it is determined to be better
        bucketIndependentAssignments = assignments;
        assignmentUpgradeCost = energyUpgradeCost;
        assignmentUnassignedModCount = unassignedModCount;
        assignmentModChangeCount = modChangeCount;
      }
    }
  }

  const itemModAssignments: {
    [itemInstanceId: string]: PluggableInventoryItemDefinition[];
  } = {};
  const resultingItemEnergies: {
    [itemInstanceId: string]: { energyCapacity: number; energyUsed: number };
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
    const requiresArtificeEnhancement =
      item.isExotic &&
      bucketSpecific.some(
        (i) => i.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice,
      );
    const modsForItem = [...bucketIndependent, ...bucketSpecific];
    itemModAssignments[item.id] = modsForItem;
    if (item.energy) {
      resultingItemEnergies[item.id] = {
        energyCapacity: itemEnergies[item.id].originalCapacity,
        energyUsed: requiresArtificeEnhancement
          ? maxEnergyCapacity(item)
          : sumBy(modsForItem, (mod) => mod.plug.energyCost?.energyCost ?? 0),
      };
    }
  }

  return {
    itemModAssignments,
    resultingItemEnergies,
    unassignedMods,
    invalidMods,
    upgradeCosts: assignmentUpgradeCost
      .map((amount, idx) => ({
        amount,
        materialHash: materialsInRarityOrder[idx],
      }))
      .filter(({ amount }) => amount > 0),
  };
}

/**
 * Get active armor mod sockets and sort the sockets and mods for a greedy assignment strategy to succeed.
 */
function getArmorSocketsAndMods(
  sockets: DimSockets | null,
  mods: readonly PluggableInventoryItemDefinition[],
) {
  const orderedSockets = getSocketsByCategoryHash(sockets, SocketCategoryHashes.ArmorMods)
    // If a socket is not plugged (even with an empty socket) we consider it disabled
    // This needs to be checked as the 30th anniversary armour has the Artifice socket
    // but the API considers it to be disabled.
    .filter(
      (socket) =>
        socket.plugged &&
        // TODO: Edge of Fate: This is a hacky fix for the masterwork socket
        // that has appeared. We should maybe exclude it from the socket list
        // entirely since it seems redundant with the energy track?
        socket.socketDefinition.socketTypeHash !== 1843767421,
    )
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
  const orderedMods = mods.toSorted(
    compareBy((mod) => count(orderedSockets, (s) => plugFitsIntoSocket(s, mod.hash))),
  );

  return { orderedSockets, orderedMods };
}

/**
 * Assign bucket specific mods based on the configured max energy capacity and
 * available socket types, partitioning mods based whether they could fit.
 * Socket choice for mod assignment is greedy, but uses a heuristic based on the
 * number of sockets a mod could fit into, since mods that can fit into fewer
 * sockets must be prioritized.
 */
export function assignBucketSpecificMods(
  armorEnergyRules: ArmorEnergyRules,
  item: DimItem,
  modsToAssign: PluggableInventoryItemDefinition[],
): {
  assigned: PluggableInventoryItemDefinition[];
  unassigned: PluggableInventoryItemDefinition[];
} {
  // given spending rules, what we can assume this item's energy is
  let itemEnergyCapacity = calculateAssumedItemEnergy(item, armorEnergyRules);

  const { orderedSockets, orderedMods } = getArmorSocketsAndMods(item.sockets, modsToAssign);

  const assigned = [];
  const unassigned = [];

  // Mutually exclusive armor mods are currently always bucket-specific mods,
  // so doing it here to cover both single loadouts and LO item filtering
  const exclusionGroups: string[] = [];

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

    const exclusionGroup = getModExclusionGroup(mod);
    if (exclusionGroup && exclusionGroups.includes(exclusionGroup)) {
      // We already have a mod mutually exclusive with this one
      unassigned.push(mod);
      continue;
    }

    assigned.push(mod);
    itemEnergyCapacity -= modCost;
    orderedSockets.splice(socketIndex, 1);
    if (exclusionGroup) {
      exclusionGroups.push(exclusionGroup);
    }
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
  clearUnassignedSocketsPerItem = false,
): Assignment[] {
  const assignments: Assignment[] = [];

  if (!item.sockets) {
    return assignments;
  }

  const { orderedSockets, orderedMods } = getArmorSocketsAndMods(item.sockets, modsToInsert);

  for (const modToInsert of orderedMods) {
    // If this mod is already plugged somewhere, that's the slot we want to keep it in
    let destinationSocketIndex = orderedSockets.findIndex(
      (socket) => socket.plugged!.plugDef.hash === modToInsert.hash,
    );

    // If what the game calls a "similar" mod is plugged somewhere, choose to replace that
    if (destinationSocketIndex === -1) {
      const toPlugExclusionGroup = getModExclusionGroup(modToInsert);
      destinationSocketIndex = orderedSockets.findIndex(
        (socket) =>
          plugFitsIntoSocket(socket, modToInsert.hash) &&
          getModExclusionGroup(socket.plugged!.plugDef) === toPlugExclusionGroup,
      );
    }

    // If it wasn't found already plugged, find the first socket with a matching PCH
    if (destinationSocketIndex === -1) {
      destinationSocketIndex = orderedSockets.findIndex((socket) =>
        plugFitsIntoSocket(socket, modToInsert.hash),
      );
    }

    // If a destination socket couldn't be found for this plug, something is seriously? wrong
    if (destinationSocketIndex === -1) {
      throw new Error(
        `We couldn't find anywhere to plug the mod ${modToInsert.displayProperties.name} (${modToInsert.hash})`,
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
 * - remove or swap mods that are mutually exclusive with the assigned mods
 * - mark mod removals as optional, if they aren't required to free up a slot or energy
 *
 * THIS ASSUMES THE SUPPLIED ASSIGNMENTS ARE POSSIBLE,
 * on this item, with its specific mod slots, and will throw if they are not.
 * This consumes the output of `pickPlugPositions` and just orders & adds metadata
 */
export function createPluggingStrategy(
  defs: D2ManifestDefinitions,
  item: DimItem,
  assignments: Assignment[],
): PluggingAction[] {
  // stuff we need to apply, that only ever frees up energy and exclusion groups.
  // can and will be unconditionally applied first, so must have no dependencies
  const requiredRegains: PluggingAction[] = [];
  // stuff we need to apply, but it will cost us mod energy or add an exclusion group.
  // can and will be applied last
  const requiredSpends: PluggingAction[] = [];
  // stuff we MAY apply, if we need more energy freed up while applying requiredSpends
  const optionalRegains: PluggingAction[] = [];

  if (!item.energy) {
    return emptyArray();
  }

  const operationSet: PluggingAction[] = [];

  for (const assignment of assignments) {
    const destinationSocket = getSocketByIndex(item.sockets!, assignment.socketIndex)!;

    // an item might have a classified def (ornament or mod) plugged into a socket,
    // in which case DIM will have a null plugged here.
    // we fall back to assuming 0 energy cost and let bungie.net be the arbiter of the outcome
    // TO-DO: instead, allow classified plugs instead. soon (tm)
    if (!destinationSocket.plugged) {
      warnLog(
        'loadout mods',
        `${item.name} socket #${assignment.socketIndex} was found to be null, indicating it might not exist at all in practice. attempting to create a plugging plan for it, but it might not work`,
      );
    }
    const existingModCost = destinationSocket.plugged?.plugDef.plug.energyCost?.energyCost || 0;

    const plannedModCost = assignment.mod.plug.energyCost?.energyCost || 0;
    const energySpend = plannedModCost - existingModCost;

    // Notes on mod exclusion groups (restrictions on similar mods already applied):
    // If we replace a mod with mutual exclusion behavior with a new mod, we must split this action
    // into two actions if there's a chance that this action cannot be performed unconditionally:
    // * Replacing a mod with a different mod in the same exclusion group is not allowed by the API,
    //   so we must unplug/replug in this socket.
    // * An increase in energy or a new exclusion group can cause a cyclical dependency. Optional regains
    //   always assign to empty, so they're fine, but a requiredSpend must not depend on another requiredSpend
    //   that frees up an exclusion group, and a requiredRegain must not depend on another requiredRegain or
    //   another requiredSpend that frees an exclusion group.
    // See https://github.com/DestinyItemManager/DIM/issues/7465#issuecomment-1379112834 for a fun cyclical dependency.

    const existingExclusionGroup = destinationSocket.plugged
      ? getModExclusionGroup(destinationSocket.plugged.plugDef)
      : undefined;
    const assignmentExclusionGroup = getModExclusionGroup(assignment.mod);

    const pluggingAction: PluggingAction = {
      ...assignment,
      energySpend,
      required: assignment.requested,
      exclusionGroupAdded: assignmentExclusionGroup,
      exclusionGroupReleased: existingExclusionGroup,
    };

    if (destinationSocket.plugged?.plugDef.hash === assignment.mod.hash) {
      // this is an assignment to itself, which is a no-op, so we can just
      // immediately perform it if needed
      if (pluggingAction.required) {
        operationSet.push(pluggingAction);
      }
    } else if (pluggingAction.energySpend > 0 && !pluggingAction.exclusionGroupReleased) {
      // this spends energy and doesn't release an exclusion group,
      // so nothing depends on this being applied
      requiredSpends.push(pluggingAction);
    } else if (!pluggingAction.required && isAssigningToDefault(item, assignment)) {
      // assigningToDefault ensures this frees up energy and doesn't add an exclusion group,
      // so requiredSpends can schedule these as needed to free up energy or release exclusion groups
      optionalRegains.push(pluggingAction);
    } else if (pluggingAction.energySpend <= 0 && !pluggingAction.exclusionGroupAdded) {
      // this frees up energy and doesn't add an exclusion group, so it doesn't
      // depend on anything else being applied
      requiredRegains.push(pluggingAction);
    } else {
      // We have an action that both depends on some things and can be a dependency for other things,
      // so we must split this action, turning an assignment A->B into an A->EMPTY->...other actions->B

      // Reset the socket to empty
      requiredRegains.push({
        energySpend: -existingModCost,
        required: true,
        exclusionGroupAdded: undefined,
        // doesn't matter, since required regains are unconditionally performed first
        // so it's as if this mod never existed
        exclusionGroupReleased: existingExclusionGroup,
        mod: defs.InventoryItem.get(
          destinationSocket.emptyPlugItemHash!,
        ) as PluggableInventoryItemDefinition,
        socketIndex: assignment.socketIndex,
        requested: false,
      });

      // Perform the actual plug
      requiredSpends.push({
        ...assignment,
        energySpend: plannedModCost,
        exclusionGroupAdded: assignmentExclusionGroup,
        exclusionGroupReleased: undefined,
        required: true,
      });
    }
  }

  // sort lower gains first, but put zero gains at the end. Otherwise the zero
  // gains will be used as part of "adding up" to make the energy needed
  optionalRegains.sort(
    compareBy((res) => (res.energySpend < 0 ? -res.energySpend : Number.MAX_VALUE)),
  );

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
    while (
      itemCurrentUsedEnergy + spendOperation.energySpend > itemTotalEnergy ||
      (spendOperation.exclusionGroupAdded &&
        optionalRegains.some(
          (regain) => regain.exclusionGroupReleased === spendOperation.exclusionGroupAdded,
        ))
    ) {
      if (!optionalRegains.length) {
        throw new Error(
          `there's not enough energy to assign ${spendOperation.mod.displayProperties.name} to ${item.name}, but no more energy can be freed up`,
        );
      }
      // we'll apply optional energy regains to make space
      const itemCurrentFreeEnergy = itemTotalEnergy - itemCurrentUsedEnergy;
      const extraEnergyNeeded = spendOperation.energySpend - itemCurrentFreeEnergy;

      const whichRegainToUse =
        (spendOperation.exclusionGroupAdded !== undefined &&
          optionalRegains.find(
            (regain) => regain.exclusionGroupReleased === spendOperation.exclusionGroupAdded,
          )) ||
        (optionalRegains.find((r) => -r.energySpend >= extraEnergyNeeded) ?? optionalRegains[0]);

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
  itemEnergy: ItemEnergy,
) {
  const modTag = getModTypeTagByPlugCategoryHash(activityMod.plug.plugCategoryHash);

  return (
    isModEnergyValid(itemEnergy, activityMod) &&
    modTag &&
    itemSocketMetadata?.some((metadata) => metadata.slotTag === modTag)
  );
}

function calculateUpgradeCost(
  items: DimItem[],
  itemEnergies: { [itemId: string]: ItemEnergy },
  assignments: ModAssignments,
  bucketSpecificAssignments: ModAssignments,
  upgradeCostModel: EnergyUpgradeCostModel,
) {
  return items.reduce((existingCost: number[] | undefined, item: DimItem) => {
    const itemEnergy = itemEnergies[item.id];
    const assignedMods = assignments[item.id].assigned;
    const hasArtificeMod = bucketSpecificAssignments[item.id].assigned.some(
      (i) => i.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice,
    );
    const totalModCost =
      itemEnergy.used + sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost ?? 0);
    const newItemCapacity = Math.max(totalModCost, itemEnergy.originalCapacity);
    const thisItemUpgradeCost = getUpgradeCost(
      upgradeCostModel,
      itemEnergy,
      item,
      newItemCapacity,
      hasArtificeMod,
    );
    return existingCost
      ? existingCost.map((val, idx) => val + thisItemUpgradeCost[idx])
      : thisItemUpgradeCost;
  }, undefined)!;
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
    used: sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0),
    originalCapacity: item.energy?.energyCapacity || 0,
    derivedCapacity: calculateAssumedItemEnergy(item, armorEnergyRules),
    rarity: item.rarity,
  };
}

interface ItemEnergy {
  used: number;
  originalCapacity: number;
  derivedCapacity: number;
  rarity: ItemRarityName;
}
/**
 * Validates whether a mod can be assigned to an item in the mod assignments algorithm.
 *
 * This checks that the summed mod energies are within the derived mod capacity for
 * an item (derived from armour upgrade options).
 */
function isModEnergyValid(
  itemEnergy: ItemEnergy,
  modToAssign: PluggableInventoryItemDefinition,
  ...assignedMods: (PluggableInventoryItemDefinition | null)[]
) {
  // Items with 0 energy are armor 1.0 / armor 1.5
  if (itemEnergy.originalCapacity < 1) {
    return false;
  }
  const modToAssignCost = modToAssign.plug.energyCost?.energyCost ?? 0;
  const assignedModsCost = sumBy(assignedMods, (mod) => mod?.plug.energyCost?.energyCost ?? 0);

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
      item.hash,
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
  bucketIndependentAssignmentsForItem: PluggableInventoryItemDefinition[],
) {
  let count = 0;

  for (const mod of bucketIndependentAssignmentsForItem) {
    const socketsThatWillFitMod = getSocketsByCategoryHash(
      item.sockets,
      SocketCategoryHashes.ArmorMods,
    );
    if (socketsThatWillFitMod.some((socket) => socket.plugged?.plugDef.hash === mod.hash)) {
      continue;
    } else {
      count += 1;
    }
  }

  return count;
}
