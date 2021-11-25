import { getPower } from '../utils';
import { IntermediateProcessArmorSet, ProcessItem } from './types';

interface TierSet {
  tier: number;
  // Stat mixes ordered by decreasing lexical order of the statMix string
  statMixes: {
    statMix: string;
    // Armor sets ordered by decreasing power
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
  // TODO: rewrite this to just use comparators!
  insert(tier: number, statMix: string, armor: ProcessItem[], stats: number[]) {
    if (this.tiers.length === 0) {
      this.tiers.push({ tier, statMixes: [{ statMix, armorSets: [{ armor, stats }] }] });
    } else {
      outer: for (let tierIndex = 0; tierIndex < this.tiers.length; tierIndex++) {
        const currentTier = this.tiers[tierIndex];

        // This set has better overall tier, insert
        if (tier > currentTier.tier) {
          this.tiers.splice(tierIndex, 0, {
            tier,
            statMixes: [{ statMix, armorSets: [{ armor, stats }] }],
          });
          break outer;
        }

        // Same tier, insert this armor mix into the list at the right order
        if (tier === currentTier.tier) {
          const currentStatMixes = currentTier.statMixes;

          if (insertStatMix(currentStatMixes, statMix, armor, stats)) {
            break outer;
          } else {
            return false;
          }
        }

        // This is lower tier than our previous lowest tier
        if (tierIndex === this.tiers.length - 1) {
          if (this.totalSets < this.capacity) {
            this.tiers.push({ tier, statMixes: [{ statMix, armorSets: [{ armor, stats }] }] });
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
   * Get all tracked armor sets as a flat list.
   */
  getArmorSets(): IntermediateProcessArmorSet[] {
    return this.tiers.map((set) => set.statMixes.map((mix) => mix.armorSets)).flat(2);
  }
}

function insertStatMix(
  currentStatMixes: {
    statMix: string;
    armorSets: IntermediateProcessArmorSet[];
  }[],
  statMix: string,
  armor: ProcessItem[],
  stats: number[]
): boolean {
  for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
    const currentStatMix = currentStatMixes[statMixIndex];

    // Better mix, insert here
    if (statMix > currentStatMix.statMix) {
      currentStatMixes.splice(statMixIndex, 0, { statMix, armorSets: [{ armor, stats }] });
      return true;
    }

    // Same mix, pick the one that uses fewest stat mods
    if (currentStatMix.statMix === statMix) {
      return insertArmorSet(armor, stats, currentStatMix.armorSets);
    }

    // This is the worst mix for this tier we've seen, but it could still be better than something at a lower tier
    if (statMixIndex === currentStatMixes.length - 1) {
      currentStatMixes.push({ statMix, armorSets: [{ armor, stats }] });
      return true;
    }
  }
  return true;
}
function insertArmorSet(
  armor: ProcessItem[],
  stats: number[],
  armorSets: IntermediateProcessArmorSet[]
) {
  const armorSetPower = getPower(armor);
  for (let armorSetIndex = 0; armorSetIndex < armorSets.length; armorSetIndex++) {
    if (armorSetPower > getPower(armorSets[armorSetIndex].armor)) {
      armorSets.splice(armorSetIndex, 0, { armor, stats });
      return true;
    }
    if (armorSetIndex === armorSets.length - 1) {
      armorSets.push({ armor, stats });
      return true;
    }
  }
  return false;
}
