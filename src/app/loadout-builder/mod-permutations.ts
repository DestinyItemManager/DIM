import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ProcessMod } from './process-worker/types';

export function generateProcessModPermutations(mods: (ProcessMod | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reudce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same energy tyoe
  // and cost, they are identical from the mod assignment perspective.
  // This works because we check to see if we have already recorded this string
  // in heaps algorithm before we add the permutation to the result.
  const createPermutationKey = (permutation: (ProcessMod | null)[]) =>
    permutation
      .map((mod) => {
        if (mod) {
          const energyType = mod.energy?.type || DestinyEnergyType.Any;
          const energyCost = mod.energy?.val || 0;
          return `${energyType}${energyCost}${mod.tag}`;
        }
      })
      .filter(Boolean)
      .join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}

export function generateModPermutations(mods: (PluggableInventoryItemDefinition | null)[]) {
  // Creates a string from the mod permutation containing the unique properties
  // that we care about, so we can reudce to the minimum number of permutations.
  // If two different mods that fit in the same socket have the same energy tyoe
  // and cost, they are identical from the mod assignment perspective.
  // This works because we check to see if we have already recorded this string
  // in heaps algorithm before we add the permutation to the result.
  const createPermutationKey = (permutation: (PluggableInventoryItemDefinition | null)[]) =>
    permutation
      .map((mod) => {
        if (mod) {
          const energyType = mod.plug.energyCost?.energyType || DestinyEnergyType.Any;
          const energyCost = mod.plug.energyCost?.energyCost || 0;
          return `${energyType}${energyCost}${mod.plug.plugCategoryHash}`;
        }
      })
      .filter(Boolean)
      .join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}

/**
 * This is heaps algorithm implemented for generating mod permutations.
 * https://en.wikipedia.org/wiki/Heap%27s_algorithm
 *
 * Note that we ensure the array length is always 5 so mods are aligned
 * with the 5 items.
 */
function generatePermutationsOfFive<T>(
  items: T[],
  createPermutationKey: (items: (T | null)[]) => string
): (T | null)[][] {
  if (!items.length) {
    return [[null, null, null, null, null]];
  }
  const cursorArray = [0, 0, 0, 0, 0];
  const itemsCopy: (T | null)[] = Array.from(items);
  const containsSet = new Set<string>();

  while (itemsCopy.length < 5) {
    itemsCopy.push(null);
  }

  let i = 0;

  const rtn = [Array.from(itemsCopy)];
  containsSet.add(createPermutationKey(itemsCopy));

  while (i < 5) {
    if (cursorArray[i] < i) {
      if (i % 2 === 0) {
        [itemsCopy[0], itemsCopy[i]] = [itemsCopy[i], itemsCopy[0]];
      } else {
        [itemsCopy[cursorArray[i]], itemsCopy[i]] = [itemsCopy[i], itemsCopy[cursorArray[i]]];
      }
      const permutationKey = createPermutationKey(itemsCopy);
      if (!containsSet.has(permutationKey)) {
        rtn.push(Array.from(itemsCopy));
        containsSet.add(permutationKey);
      }
      cursorArray[i] += 1;
      i = 0;
    } else {
      cursorArray[i] = 0;
      i += 1;
    }
  }

  return rtn;
}
