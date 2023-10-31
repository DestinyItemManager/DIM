import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { MAX_ARMOR_ENERGY_CAPACITY, MAX_SLOT_INDEPENDENT_MODS } from 'app/search/d2-known-values';
import { errorLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { slotSpecificPlugCategoryHashes } from './known-values';
import { categorizeArmorMods, getModCost } from './mod-assignment-utils';
import { generatePermutationsOfFive } from './mod-permutations';
import { getBucketHashFromPlugCategoryHash } from './mod-utils';

export const getDefaultSlotSpecificBucketHashToNumberRecord = (): Partial<
  Record<BucketHashes, number>
> => ({
  [BucketHashes.Helmet]: 0,
  [BucketHashes.Gauntlets]: 0,
  [BucketHashes.ChestArmor]: 0,
  [BucketHashes.LegArmor]: 0,
  [BucketHashes.ClassArmor]: 0,
});

export function sumParallelArrays(arrays: number[][]): number[] {
  // If all arrays are not the same length, throw an error
  if (!arrays.every((arr) => arr.length === arrays[0].length)) {
    errorLog('loadouts', 'All arrays must be the same length');
    return [];
  }
  // Use lodash's zipWith function to combine the arrays element-wise and sum them
  const result = _.zipWith(...arrays, (...values: number[]) => _.sum(values));

  return result;
}

// Pad an array to length 5 with 0s
export const padCostArray = (arr: number[]) => Array.from({ ...arr, length: 5 }, (v) => v ?? 0);

// When "optimistic" is false this will short-circuit early as soon as it finds
// a single permutation of mods that have a valid placement. When "optimistic"
// is true it will continue to search all permutations to get the maximum
// potentially available energy for each slot.
export const getAvailableArmorSlotEnergyCapacities = memoizeOne(
  (
    allSelectedMods: PluggableInventoryItemDefinition[],
    optimistic = false,
  ): Partial<Record<BucketHashes, number>> | null => {
    const {
      modMap: { generalMods, bucketSpecificMods, activityMods, artificeMods },
      unassignedMods,
    } = categorizeArmorMods(allSelectedMods);

    // First do some very basic sanity checks
    if (unassignedMods.length > 0) {
      errorLog(
        'loadouts',
        'Unassigned mods found in getMaximumPotentiallyAvailableArmorSlotEnergyCapacities',
      );
      return null;
    }

    if (generalMods.length > MAX_SLOT_INDEPENDENT_MODS) {
      errorLog(
        'loadouts',
        `More than ${MAX_SLOT_INDEPENDENT_MODS} general mods found in getMaximumPotentiallyAvailableArmorSlotEnergyCapacities`,
      );
      return null;
    }

    if (artificeMods.length + activityMods.length > MAX_SLOT_INDEPENDENT_MODS) {
      errorLog(
        'loadouts',
        `More than ${MAX_SLOT_INDEPENDENT_MODS} artifice + specialty mods found in getMaximumPotentiallyAvailableArmorSlotEnergyCapacities`,
      );
      return null;
    }

    const availableArmorSlotEnergyCapacities = getDefaultSlotSpecificBucketHashToNumberRecord();
    const selectedSlotSpecificCosts = getDefaultSlotSpecificBucketHashToNumberRecord();
    const generalModCosts: number[] = [];
    const specialtySocketModCosts: number[] = [];
    for (const bucketHash of D2Categories.Armor) {
      for (const mod of bucketSpecificMods[bucketHash] ?? []) {
        const cost = getModCost(mod);
        selectedSlotSpecificCosts[bucketHash]! += cost;
      }
    }

    for (const mod of generalMods) {
      generalModCosts.push(getModCost(mod));
    }

    for (const mod of activityMods) {
      specialtySocketModCosts.push(getModCost(mod));
    }

    const paddedGeneralModCosts = padCostArray(generalModCosts);
    const paddedSpecialtySocketModCosts = padCostArray(specialtySocketModCosts);
    const paddedSlotSpecificModCosts = padCostArray(
      D2Categories.Armor.map((bucketHash) => selectedSlotSpecificCosts[bucketHash]!),
    );

    const costPermutationKey = (items: (number | null)[]) => items.toString();

    const permutedGeneralModCosts = generatePermutationsOfFive(
      paddedGeneralModCosts,
      costPermutationKey,
    ) as number[][];
    const permutedSpecialtySocketModCosts = generatePermutationsOfFive(
      paddedSpecialtySocketModCosts,
      costPermutationKey,
    ) as number[][];

    let hasValidModPlacement = false;
    for (const permutedGeneralModCost of permutedGeneralModCosts) {
      for (const permutedSpecialtySocketModCost of permutedSpecialtySocketModCosts) {
        const sum = sumParallelArrays([
          paddedSlotSpecificModCosts,
          permutedGeneralModCost,
          permutedSpecialtySocketModCost,
        ]);
        if (sum.some((cost) => cost > MAX_ARMOR_ENERGY_CAPACITY)) {
          continue; // Skip the rest of the current iteration
        }
        hasValidModPlacement = true;
        // TODO: Maybe we can break out of these nested loops early
        // if all the maximum values are 10 at any point...
        for (const [i, plugCategoryHash] of slotSpecificPlugCategoryHashes.entries()) {
          const bucketHash = getBucketHashFromPlugCategoryHash(plugCategoryHash);
          availableArmorSlotEnergyCapacities[bucketHash!] = Math.max(
            availableArmorSlotEnergyCapacities[bucketHash!] ?? 0,
            MAX_ARMOR_ENERGY_CAPACITY - sum[i],
          );
        }
        if (!optimistic) {
          return availableArmorSlotEnergyCapacities;
        }
      }
    }

    return hasValidModPlacement ? availableArmorSlotEnergyCapacities : null;
  },
);
