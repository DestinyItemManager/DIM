import { IntermediateProcessArmorSet } from 'types';
import { getPower } from '../utils';

/**
 * A list of stat mixes by total tier. We can keep this list up to date
 * as we process new sets with an insertion sort algorithm.
 */
export type SetTracker = {
  tier: number;
  statMixes: { statMix: string; armorSets: IntermediateProcessArmorSet[] }[];
}[];

/**
 * Use an insertion sort algorithm to keep an ordered list of sets first by total tier, then by stat mix within a tier.
 * This takes advantage of the fact that strings are lexically comparable, but maybe it does that badly...
 */
// TODO: replace with trie?
export function insertIntoSetTracker(
  tier: number,
  statMix: string,
  armorSet: IntermediateProcessArmorSet,
  setTracker: SetTracker
): void {
  if (setTracker.length === 0) {
    setTracker.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
    return;
  }

  for (let tierIndex = 0; tierIndex < setTracker.length; tierIndex++) {
    const currentTier = setTracker[tierIndex];

    if (tier > currentTier.tier) {
      setTracker.splice(tierIndex, 0, { tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
      return;
    }

    if (tier === currentTier.tier) {
      const currentStatMixes = currentTier.statMixes;

      for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
        const currentStatMix = currentStatMixes[statMixIndex];

        if (statMix > currentStatMix.statMix) {
          currentStatMixes.splice(statMixIndex, 0, { statMix, armorSets: [armorSet] });
          return;
        }

        if (currentStatMix.statMix === statMix) {
          for (
            let armorSetIndex = 0;
            armorSetIndex < currentStatMix.armorSets.length;
            armorSetIndex++
          ) {
            if (
              getPower(armorSet.armor) > getPower(currentStatMix.armorSets[armorSetIndex].armor)
            ) {
              currentStatMix.armorSets.splice(armorSetIndex, 0, armorSet);
            } else {
              currentStatMix.armorSets.push(armorSet);
            }
            return;
          }
        }

        if (statMixIndex === currentStatMixes.length - 1) {
          currentStatMixes.push({ statMix, armorSets: [armorSet] });
          return;
        }
      }
    }

    if (tierIndex === setTracker.length - 1) {
      setTracker.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
      return;
    }
  }
}

/**
 * Returns the lowest known tier
 */
export function trimWorstSet(setTracker: SetTracker) {
  const lowestTierSet = setTracker[setTracker.length - 1];
  const worstMix = lowestTierSet.statMixes[lowestTierSet.statMixes.length - 1];

  worstMix.armorSets.pop();

  if (worstMix.armorSets.length === 0) {
    lowestTierSet.statMixes.pop();

    if (lowestTierSet.statMixes.length === 0) {
      setTracker.pop();
    }
  }
  return setTracker[setTracker.length - 1].tier;
}

export function getAllSets(setTracker: SetTracker) {
  return setTracker.map((set) => set.statMixes.map((mix) => mix.armorSets)).flat(2);
}
