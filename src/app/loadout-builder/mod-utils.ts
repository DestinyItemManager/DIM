import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { combatCompatiblePlugCategoryHashes } from 'app/search/specialty-modslots';
import { getModTypeTagByPlugCategoryHash, getSpecialtySocketMetadatas } from 'app/utils/item-utils';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { bucketsToCategories } from './types';
import {
  canSwapEnergyFromUpgradeSpendTier,
  generatePermutationsOfFive,
  upgradeSpendTierToMaxEnergy,
} from './utils';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (
  defs: D2ManifestDefinitions,
  mod: PluggableInventoryItemDefinition,
  item: DimItem,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
) =>
  item.energy &&
  (!mod.plug.energyCost ||
    mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.plug.energyCost.energyType === item.energy.energyType ||
    canSwapEnergyFromUpgradeSpendTier(defs, upgradeSpendTier, item, lockItemEnergyType));

/**
 * Checks to see if some mod in a collection of LockedMod or LockedMod,
 * has an elemental (non-Any) energy requirement
 */
export function someModHasEnergyRequirement(mods: PluggableInventoryItemDefinition[]) {
  return mods.some(
    (mod) => !mod.plug.energyCost || mod.plug.energyCost.energyType !== DestinyEnergyType.Any
  );
}

function stringifyMods(permutation: (PluggableInventoryItemDefinition | null)[]) {
  let permutationString = '';
  for (const modOrNull of permutation) {
    if (modOrNull) {
      const energy = modOrNull.plug.energyCost;
      permutationString += `(${energy?.energyType},${energy?.energyCost},${modOrNull.plug.plugCategoryHash})`;
    }
    permutationString += ',';
  }
  return permutationString;
}

interface ItemEnergy {
  used: number;
  originalCapacity: number;
  derivedCapacity: number;
  originalType: DestinyEnergyType;
  derivedType: DestinyEnergyType;
}

function calculateEnergyChange(
  itemEnergy: ItemEnergy,
  generalMod: PluggableInventoryItemDefinition | null,
  combatMod: PluggableInventoryItemDefinition | null,
  raidMod: PluggableInventoryItemDefinition | null
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
    raidMod?.plug.energyCost &&
    raidMod?.plug.energyCost?.energyType !== DestinyEnergyType.Any
  ) {
    finalEnergy = raidMod.plug.energyCost.energyType;
  }

  const generalModCost = generalMod?.plug.energyCost?.energyCost || 0;
  const combatModCost = combatMod?.plug.energyCost?.energyCost || 0;
  const raidModCost = raidMod?.plug.energyCost?.energyCost || 0;

  const modCost = itemEnergy.used + generalModCost + combatModCost + raidModCost;
  const energyUsedAndWasted = modCost + itemEnergy.originalCapacity;
  const energyInvested = Math.max(0, modCost - itemEnergy.originalCapacity);

  return finalEnergy === itemEnergy.originalType ? energyInvested : energyUsedAndWasted;
}

function getItemEnergyType(
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

function energyTypesAreCompatible(first: DestinyEnergyType, second: DestinyEnergyType) {
  return first === second || first === DestinyEnergyType.Any || second === DestinyEnergyType.Any;
}

export function getModAssignments(
  items: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  defs: D2ManifestDefinitions | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
): Map<string, PluggableInventoryItemDefinition[]> {
  if (!defs) {
    return new Map();
  }

  const bucketSpecificAssignments = new Map<string, PluggableInventoryItemDefinition[]>();
  const bucketIndependantAssignments = new Map<string, PluggableInventoryItemDefinition[]>();
  // just an arbitrarily large number
  let assignmentEnergyCost = 10000;

  for (const item of items) {
    bucketSpecificAssignments.set(item.id, []);
    bucketIndependantAssignments.set(item.id, []);
  }

  const itemSocketMetadata = _.mapValues(
    _.keyBy(items, (item) => item.id),
    (item) => getSpecialtySocketMetadatas(item)
  );

  const generalMods: PluggableInventoryItemDefinition[] = [];
  const combatMods: PluggableInventoryItemDefinition[] = [];
  const raidMods: PluggableInventoryItemDefinition[] = [];

  for (const mod of mods) {
    if (mod.plug.plugCategoryHash === armor2PlugCategoryHashesByName.general) {
      generalMods.push(mod);
    } else if (combatCompatiblePlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
      combatMods.push(mod);
    } else if (raidModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
      raidMods.push(mod);
    } else {
      const itemForMod = items.find(
        (item) => mod.plug.plugCategoryHash === bucketsToCategories[item.bucket.hash]
      );
      itemForMod && bucketSpecificAssignments.get(itemForMod.id)?.push(mod);
    }
  }

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
        bucketSpecificAssignments[item.id]
      ),
    })
  );

  const generalModPermutations = generatePermutationsOfFive(generalMods, stringifyMods);
  const combatModPermutations = generatePermutationsOfFive(combatMods, stringifyMods);
  const raidModPermutations = generatePermutationsOfFive(raidMods, stringifyMods);

  combatModLoop: for (const combatP of combatModPermutations) {
    combatItemLoop: for (let i = 0; i < items.length; i++) {
      const combatMod = combatP[i];

      // If a mod is null there is nothing being socketed into the item so move on
      if (!combatMod) {
        continue combatItemLoop;
      }

      const item = items[i];
      const itemEnergy = itemEnergies[item.id];
      const modTag = getModTypeTagByPlugCategoryHash(combatMod.plug.plugCategoryHash);
      const combatEnergyCost = combatMod.plug.energyCost?.energyCost || 0;
      const combatEnergyType = combatMod.plug.energyCost?.energyType || DestinyEnergyType.Any;

      const combatEnergyIsValid =
        itemEnergy &&
        itemEnergy.used + combatEnergyCost <= itemEnergy.derivedCapacity &&
        energyTypesAreCompatible(itemEnergy.derivedType, combatEnergyType);

      // The other mods wont fit in the item set so move on to the next set of mods
      if (
        !(
          combatEnergyIsValid &&
          modTag &&
          itemSocketMetadata[item.id]?.some((metadata) =>
            metadata.compatibleModTags.includes(modTag)
          )
        )
      ) {
        continue combatModLoop;
      }
    }

    generalModLoop: for (const generalP of generalModPermutations) {
      generalItemLoop: for (let i = 0; i < items.length; i++) {
        const generalMod = generalP[i];

        // If a mod is null there is nothing being socketed into the item so move on
        if (!generalMod) {
          continue generalItemLoop;
        }

        const item = items[i];
        const itemEnergy = itemEnergies[item.id];
        const generalEnergyCost = generalMod.plug.energyCost?.energyCost || 0;
        const generalEnergyType = generalMod.plug.energyCost?.energyType || DestinyEnergyType.Any;
        const combatEnergyCost = combatP?.[i]?.plug.energyCost?.energyCost || 0;
        const combatEnergyType = combatP?.[i]?.plug.energyCost?.energyType || DestinyEnergyType.Any;

        const generalEnergyIsValid =
          itemEnergy &&
          itemEnergy.used + generalEnergyCost + combatEnergyCost <= itemEnergy.derivedCapacity &&
          energyTypesAreCompatible(itemEnergy.derivedType, generalEnergyType) &&
          energyTypesAreCompatible(generalEnergyType, combatEnergyType);

        // The general mods wont fit in the item set so move on to the next set of mods
        if (!generalEnergyIsValid) {
          continue generalModLoop;
        }
      }

      raidModLoop: for (const raidP of raidModPermutations) {
        raidItemLoop: for (let i = 0; i < items.length; i++) {
          const raidMod = raidP[i];

          // If a mod is null there is nothing being socketed into the item so move on
          if (!raidMod) {
            continue raidItemLoop;
          }

          const item = items[i];
          const itemEnergy = itemEnergies[item.id];
          const modTag = getModTypeTagByPlugCategoryHash(raidMod.plug.plugCategoryHash);
          const raidEnergyCost = raidMod.plug.energyCost?.energyCost || 0;
          const raidEnergyType = raidMod.plug.energyCost?.energyType || DestinyEnergyType.Any;
          const generalEnergyCost = generalP[i]?.plug.energyCost?.energyCost || 0;
          const generalEnergyType =
            generalP[i]?.plug.energyCost?.energyType || DestinyEnergyType.Any;
          const combatEnergyCost = combatP[i]?.plug.energyCost?.energyCost || 0;
          const combatEnergyType = combatP[i]?.plug.energyCost?.energyType || DestinyEnergyType.Any;

          const raidEnergyIsValid =
            itemEnergy &&
            itemEnergy.used + generalEnergyCost + combatEnergyCost + raidEnergyCost <=
              itemEnergy.derivedCapacity &&
            energyTypesAreCompatible(itemEnergy.derivedType, raidEnergyType) &&
            energyTypesAreCompatible(raidEnergyType, generalEnergyType) &&
            energyTypesAreCompatible(raidEnergyType, combatEnergyType);

          // The raid mods wont fit in the item set so move on to the next set of mods
          if (
            !(
              raidEnergyIsValid &&
              modTag &&
              itemSocketMetadata[item.id]?.some((metadata) =>
                metadata.compatibleModTags.includes(modTag)
              )
            )
          ) {
            continue raidModLoop;
          }
        }

        // To hit this point we must have found a

        let energyUsedAndWasted = 0;
        for (let i = 0; i < items.length; i++) {
          energyUsedAndWasted += calculateEnergyChange(
            itemEnergies[items[i].id],
            generalP[i],
            combatP[i],
            raidP[i]
          );
        }

        if (energyUsedAndWasted < assignmentEnergyCost) {
          for (let i = 0; i < items.length; i++) {
            bucketIndependantAssignments.set(
              items[i].id,
              _.compact([generalP[i], combatP[i], raidP[i]])
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
      ...(bucketIndependantAssignments.get(item.id) || []),
    ]);
  }

  return mergedResults;
}

// TODO (ryan) This is a super lazy way of getting unassigned mods but doing it properly
// is hard. To do it properly we need to check every possible combination and even if its
// not a valid fit for the mods, we need to calculate how good it is (least number of unassigned?).
// This will make all slot independant mods unassigned if it doesn't find a valid fit.
export function getAssignedAndUnassignedMods(
  items: DimItem[],
  mods: PluggableInventoryItemDefinition[],
  defs: D2ManifestDefinitions | undefined,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
): [ReturnType<typeof getModAssignments>, PluggableInventoryItemDefinition[]] {
  const assignedMods = getModAssignments(items, mods, defs, upgradeSpendTier, lockItemEnergyType);
  const flatAssignedMods = Array.from(assignedMods.values()).flat();
  const unassignedMods = mods.filter((mod) => !flatAssignedMods.includes(mod));
  return [assignedMods, unassignedMods];
}
