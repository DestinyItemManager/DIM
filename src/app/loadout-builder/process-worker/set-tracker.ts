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

          for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
            const currentStatMix = currentStatMixes[statMixIndex];

            // Better mix, insert here
            if (statMix > currentStatMix.statMix) {
              currentStatMixes.splice(statMixIndex, 0, { statMix, armorSets: [{ armor, stats }] });
              break outer;
            }

            // Same mix, pick the one that uses fewest stat mods
            if (currentStatMix.statMix === statMix) {
              const armorSetPower = getPower(armor);
              for (
                let armorSetIndex = 0;
                armorSetIndex < currentStatMix.armorSets.length;
                armorSetIndex++
              ) {
                if (armorSetPower > getPower(currentStatMix.armorSets[armorSetIndex].armor)) {
                  currentStatMix.armorSets.splice(armorSetIndex, 0, { armor, stats });
                  break outer;
                }
                if (armorSetIndex === currentStatMix.armorSets.length - 1) {
                  currentStatMix.armorSets.push({ armor, stats });
                  break outer;
                }
              }
            }

            // This is the worst mix for this tier we've seen, but it could still be better than something at a lower tier
            if (statMixIndex === currentStatMixes.length - 1) {
              currentStatMixes.push({ statMix, armorSets: [{ armor, stats }] });
              break outer;
            }
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
