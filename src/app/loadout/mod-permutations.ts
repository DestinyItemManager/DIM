import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

export function generateModPermutations(mods: (PluggableInventoryItemDefinition | null)[]) {
  const createPermutationKey = (permutation: (PluggableInventoryItemDefinition | null)[]) =>
    permutation.map((mod) => mod?.hash).join(',');
  return generatePermutationsOfFive(mods, createPermutationKey);
}

/**
 * This is heaps algorithm implemented for generating mod permutations.
 * https://en.wikipedia.org/wiki/Heap%27s_algorithm
 *
 * Note that we ensure the array length is always 5 so mods are aligned
 * with the 5 items.
 */
export function generatePermutationsOfFive<T>(
  items: (T | null)[],
  createPermutationKey: (items: (T | null)[]) => string,
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
