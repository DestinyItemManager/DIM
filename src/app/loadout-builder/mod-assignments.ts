import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { upgradeSpendTierToMaxEnergy } from 'app/loadout/armor-upgrade-utils';
import {
  activityModPlugCategoryHashes,
  bucketsToCategories,
  getItemEnergyType,
  isModEnergyValid,
} from 'app/loadout/mod-utils';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { combatCompatiblePlugCategoryHashes } from 'app/search/specialty-modslots';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { generateModPermutations } from '../loadout/mod-permutations';

interface ItemEnergy {
  /** The energy currently used by slot dependant mods. */
  used: number;
  /** The original energy capacity of the item. */
  originalCapacity: number;
  /** The derived energy capacity of the item after considering armour upgrade options. */
  derivedCapacity: number;
  /** The original energy type of the item. */
  originalType: DestinyEnergyType;
  /** The derived energy type of the item after considering armour upgrade options. */
  derivedType: DestinyEnergyType;
}

/**
 * This calculates the energy change of an item with the provided mods applied.
 * This is used to score how good an set of mod assignments is.
 *
 * The idea is we want to find the mod assignments that cost the user as little
 * as possible to apply. To we this by adding up
 * - The energy investment if an item keeps it's original energy type
 * - The energy investment + the wasted energy if an energy changes energy type.
 *
 * For example if an item is solar before and after the mod assignments, it has
 * original energy of 2 and the mods cost 7, then the energy change returned is 5.
 *
 * If an item is solar then statis after mods assignments, it has original energy
 * of 5 and a resulting energy of 8, then the energy change will be 5 + 8 = 13.
 */
function calculateEnergyChange(
  itemEnergy: ItemEnergy,
  generalMod: PluggableInventoryItemDefinition | null,
  combatMod: PluggableInventoryItemDefinition | null,
  activityMod: PluggableInventoryItemDefinition | null
) {
  let finalEnergy;

  if (itemEnergy.derivedType !== DestinyEnergyType.Any) {
    finalEnergy = itemEnergy.derivedType;
  } else if (
    generalMod?.plug.energyCost &&
    generalMod?.plug.energyCost?.energyType !== DestinyEnergyType.Any
  ) {
    finalEnergy = generalMod.plug.energyCost.energyType;
  } else if (
    combatMod?.plug.energyCost &&
    combatMod?.plug.energyCost?.energyType !== DestinyEnergyType.Any
  ) {
    finalEnergy = combatMod.plug.energyCost.energyType;
  } else if (
    activityMod?.plug.energyCost &&
    activityMod?.plug.energyCost?.energyType !== DestinyEnergyType.Any
  ) {
    finalEnergy = activityMod.plug.energyCost.energyType;
  }

  const generalModCost = generalMod?.plug.energyCost?.energyCost || 0;
  const combatModCost = combatMod?.plug.energyCost?.energyCost || 0;
  const activityModCost = activityMod?.plug.energyCost?.energyCost || 0;

  const modCost = itemEnergy.used + generalModCost + combatModCost + activityModCost;
  const energyUsedAndWasted = modCost + itemEnergy.originalCapacity;
  const energyInvested = Math.max(0, modCost - itemEnergy.originalCapacity);

  return finalEnergy === itemEnergy.originalType ? energyInvested : energyUsedAndWasted;
}

/**
 * This finds the cheapest possible mod assignments for an armour set and a set of mods.
 *
 * It uses the idea of total energy spent and wasted to rank mod assignments.
 *
 * To do this we create permutations of general, combat and activity mods and loop over each
 * set of permutations and validate the possibility of the mod assignment at every level.
 * This is to ensure that we can exit early if a invalid assignment is found.
 */
export function getModAssignments(
  items: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  defs: D2ManifestDefinitions,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
): Map<string, PluggableInventoryItemDefinition[]> {
  const bucketSpecificAssignments = new Map<string, PluggableInventoryItemDefinition[]>();
  const bucketIndependentAssignments = new Map<string, PluggableInventoryItemDefinition[]>();
  // just an arbitrarily large number
  let assignmentEnergyCost = 10000;

  for (const item of items) {
    bucketSpecificAssignments.set(item.id, []);
    bucketIndependentAssignments.set(item.id, []);
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
      itemForMod && bucketSpecificAssignments.get(itemForMod.id)?.push(mod);
    }
  }

  // A object of item id's to energy information. This is so we can precalculate
  // working energy used, capacity and type and use this to validate whether a mod
  // can be used in an item.
  const itemEnergies = _.mapValues(
    _.keyBy(items, (item) => item.id),
    (item) => ({
      used: _.sumBy(
        bucketSpecificAssignments.get(item.id),
        (mod) => mod.plug.energyCost?.energyCost || 0
      ),
      originalCapacity: item.energy?.energyCapacity || 0,
      derivedCapacity: upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item),
      originalType: item.energy?.energyType || DestinyEnergyType.Any,
      derivedType: getItemEnergyType(
        defs,
        item,
        upgradeSpendTier,
        lockItemEnergyType,
        bucketSpecificAssignments.get(item.id)
      ),
    })
  );

  const generalModPermutations = generateModPermutations(generalMods);
  const combatModPermutations = generateModPermutations(combatMods);
  const activityModPermutations = generateModPermutations(activityMods);

  // loop depth 0
  activityModLoop: for (const activityPermutation of activityModPermutations) {
    // loop depth 1
    activityItemLoop: for (let i = 0; i < items.length; i++) {
      const activityMod = activityPermutation[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!activityMod) {
        continue activityItemLoop;
      }

      const item = items[i];
      const itemEnergy = itemEnergies[item.id];
      const modTag = getModTypeTagByPlugCategoryHash(activityMod.plug.plugCategoryHash);

      // The activity mods wont fit in the item set so move on to the next set of mods
      if (
        !isModEnergyValid(itemEnergy, activityMod) ||
        !modTag ||
        !itemSocketMetadata[item.id]?.some((metadata) =>
          metadata.compatibleModTags.includes(modTag)
        )
      ) {
        continue activityModLoop;
      }
    }
    // loop depth 1
    combatModLoop: for (const combatPermutation of combatModPermutations) {
      // loop depth 2
      combatItemLoop: for (let i = 0; i < items.length; i++) {
        const combatMod = combatPermutation[i];

        // If a mod is null there is nothing being socketed into the item so move on
        if (!combatMod) {
          continue combatItemLoop;
        }

        const item = items[i];
        const itemEnergy = itemEnergies[item.id];
        const modTag = getModTypeTagByPlugCategoryHash(combatMod.plug.plugCategoryHash);

        // The combat mods wont fit in the item set so move on to the next set of mods
        if (
          !isModEnergyValid(itemEnergy, combatMod, activityPermutation[i]) ||
          !modTag ||
          !itemSocketMetadata[item.id]?.some((metadata) =>
            metadata.compatibleModTags.includes(modTag)
          )
        ) {
          continue combatModLoop;
        }
      }
      // loop depth 2
      generalModLoop: for (const generalPermutation of generalModPermutations) {
        // loop depth 3
        generalItemLoop: for (let i = 0; i < items.length; i++) {
          const generalMod = generalPermutation[i];

          // If a mod is null there is nothing being socketed into the item so move on
          if (!generalMod) {
            continue generalItemLoop;
          }

          const item = items[i];
          const itemEnergy = itemEnergies[item.id];

          // The general mods wont fit in the item set so move on to the next set of mods
          if (
            !isModEnergyValid(itemEnergy, generalMod, combatPermutation[i], activityPermutation[i])
          ) {
            continue generalModLoop;
          }
        }
        // loop depth 2
        // To hit this point we must have found a valued mod assignment.
        // The loop set is designed to exit early through a continue if a
        // set of mods is found to be invalid.
        let energyUsedAndWasted = 0;
        for (let i = 0; i < items.length; i++) {
          energyUsedAndWasted += calculateEnergyChange(
            itemEnergies[items[i].id],
            generalPermutation[i],
            combatPermutation[i],
            activityPermutation[i]
          );
        }

        // if the cost of the new assignment set is better than the old one
        // we replace it and carry on until we have exhausted all permutations.
        if (energyUsedAndWasted < assignmentEnergyCost) {
          for (let i = 0; i < items.length; i++) {
            bucketIndependentAssignments.set(
              items[i].id,
              _.compact([generalPermutation[i], combatPermutation[i], activityPermutation[i]])
            );
          }
          assignmentEnergyCost = energyUsedAndWasted;
        }
      }
    }
  }

  const mergedResults = new Map<string, PluggableInventoryItemDefinition[]>();
  for (const item of items) {
    mergedResults.set(item.id, [
      ...(bucketSpecificAssignments.get(item.id) || []),
      ...(bucketIndependentAssignments.get(item.id) || []),
    ]);
  }

  return mergedResults;
}
