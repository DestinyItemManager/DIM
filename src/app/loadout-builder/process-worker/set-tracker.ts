import { getPower } from '../utils';
import { IntermediateProcessArmorSet, ProcessItem } from './types';

interface TierSet {
  tier: number;
  /** Stat mixes ordered by decreasing lexical order of the statMix string */
  statMixes: {
    statMix: string;
    // TODO: Maybe only keep one set with the same stat mix?
    /** Armor sets ordered by decreasing power */
    armorSets: IntermediateProcessArmorSet[];
  }[];
}

/**
 * A list of stat mixes by total tier. We can keep this list up to date
 * as we process new sets with an insertion sort algorithm.
 */
export class SetTracker {
  // Tiers ordered by decreasing tier
  tiers: TierSet[] = [];
  totalSets = 0;
  readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /**
   * A short-circuit helper to check if inserting a set at this total tier could possibly be accepted.
   */
  couldInsert(totalTier: number) {
    const lowestKnownTier = this.tiers.length ? this.tiers[this.tiers.length - 1].tier : 0;
    return totalTier >= lowestKnownTier || this.totalSets < this.capacity;
  }

  /**
   * Insert this set into the tracker. If the tracker is at capacity this set or another one may be dropped.
   */
  insert(tier: number, statMix: string, armor: ProcessItem[], stats: number[], statMods: number[]) {
    if (this.tiers.length === 0) {
      this.tiers.push({ tier, statMixes: [{ statMix, armorSets: [{ armor, stats, statMods }] }] });
    } else {
      // We have very few tiers at one time, so insertion sort is fine
      outer: for (let tierIndex = 0; tierIndex < this.tiers.length; tierIndex++) {
        const currentTier = this.tiers[tierIndex];

        // This set has better overall tier, insert
        if (tier > currentTier.tier) {
          this.tiers.splice(tierIndex, 0, {
            tier,
            statMixes: [{ statMix, armorSets: [{ armor, stats, statMods }] }],
          });
          break outer;
        }

        // Same tier, insert this armor mix into the list at the right order
        if (tier === currentTier.tier) {
          const currentStatMixes = currentTier.statMixes;

          if (insertStatMix(currentStatMixes, statMix, armor, stats, statMods)) {
            break outer;
          } else {
            return false;
          }
        }

        // This is lower tier than our previous lowest tier
        if (tierIndex === this.tiers.length - 1) {
          if (this.totalSets < this.capacity) {
            this.tiers.push({
              tier,
              statMixes: [{ statMix, armorSets: [{ armor, stats, statMods }] }],
            });
            break outer;
          } else {
            // Don't bother inserting it at all
            return false;
          }
        }
      }
    }

    this.totalSets++;

    return this.trimWorstSet();
  }

  private trimWorstSet(): boolean {
    if (this.totalSets <= this.capacity) {
      return true;
    }

    const lowestTierSet = this.tiers[this.tiers.length - 1];
    const worstMix = lowestTierSet.statMixes[lowestTierSet.statMixes.length - 1];

    worstMix.armorSets.pop();

    if (worstMix.armorSets.length === 0) {
      lowestTierSet.statMixes.pop();

      if (lowestTierSet.statMixes.length === 0) {
        this.tiers.pop();
      }
    }
    this.totalSets--;
    return false;
  }

  /**
   * Get the top N tracked armor sets in order.
   */
  getArmorSets(max: number) {
    const result: IntermediateProcessArmorSet[] = [];
    for (const tier of this.tiers) {
      for (const statMix of tier.statMixes) {
        for (const armorSet of statMix.armorSets) {
          result.push(armorSet);
          if (result.length >= max) {
            return result;
          }
        }
      }
    }
    return result;
  }
}

/**
 * Insert a new stat mix into the list of stat mixes (all of which sum to the
 * same tier). They should remain in lexical order of the statmix string.
 */
function insertStatMix(
  currentStatMixes: {
    statMix: string;
    armorSets: IntermediateProcessArmorSet[];
  }[],
  statMix: string,
  armor: ProcessItem[],
  stats: number[],
  statMods: number[]
): boolean {
  // This is a binary search insertion strategy, since these lists may grow large
  let start = 0;
  let end = currentStatMixes.length - 1;
  while (start < end) {
    const statMixIndex = Math.floor((end - start) / 2 + start);
    const currentStatMix = currentStatMixes[statMixIndex];

    const comparison =
      statMix > currentStatMix.statMix ? 1 : statMix < currentStatMix.statMix ? -1 : 0;

    // Same mix, pick the one that uses fewest stat mods
    if (comparison === 0) {
      return insertArmorSet(armor, stats, statMods, currentStatMix.armorSets);
    }
    if (comparison > 0) {
      end = statMixIndex - 1;
    } else {
      start = statMixIndex + 1;
    }
  }

  const currentStatMix = currentStatMixes[start];
  const comparison =
    statMix > currentStatMix.statMix ? 1 : statMix < currentStatMix.statMix ? -1 : 0;

  currentStatMixes.splice(comparison > 0 ? start : start + 1, 0, {
    statMix,
    armorSets: [{ armor, stats, statMods }],
  });
  return true;
}

function insertArmorSet(
  armor: ProcessItem[],
  stats: number[],
  statMods: number[],
  armorSets: IntermediateProcessArmorSet[]
) {
  // These lists don't tend to grow large, so it's back to insertion sort
  const armorSetPower = getPower(armor);
  for (let armorSetIndex = 0; armorSetIndex < armorSets.length; armorSetIndex++) {
    if (armorSetPower > getPower(armorSets[armorSetIndex].armor)) {
      armorSets.splice(armorSetIndex, 0, { armor, stats, statMods });
      return true;
    }
    if (armorSetIndex === armorSets.length - 1) {
      armorSets.push({ armor, stats, statMods });
      return true;
    }
  }
  return false;
}
