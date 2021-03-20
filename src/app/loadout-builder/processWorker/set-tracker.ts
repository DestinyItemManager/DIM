import { getPower } from '../utils';
import { IntermediateProcessArmorSet } from './types';

interface TierSet {
  tier: number;
  statMixes: { statMix: string; armorSets: IntermediateProcessArmorSet[] }[];
}

/**
 * A list of stat mixes by total tier. We can keep this list up to date
 * as we process new sets with an insertion sort algorithm.
 */
export class SetTracker {
  tiers: TierSet[] = [];
  totalSets = 0;
  lowestTier = 100;
  capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /**
   * A short-circuit helper to check if inserting a set at this total tier could possibly be accepted.
   */
  couldInsert(totalTier: number) {
    return totalTier >= this.lowestTier || this.totalSets < this.capacity;
  }

  /**
   * Insert this set into the tracker. If the tracker is at capacity this set or another one may be dropped.
   */
  insert(tier: number, statMix: string, armorSet: IntermediateProcessArmorSet) {
    if (tier < this.lowestTier) {
      this.lowestTier = tier;
    }
    if (this.tiers.length === 0) {
      this.tiers.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
      this.totalSets++;
      return;
    }

    let inserted = false;
    // TODO: reverse order!
    outer: for (let tierIndex = 0; tierIndex < this.tiers.length; tierIndex++) {
      const currentTier = this.tiers[tierIndex];

      if (tier > currentTier.tier) {
        this.tiers.splice(tierIndex, 0, { tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
        this.totalSets++;
        inserted = true;
        break outer;
      }

      if (tier === currentTier.tier) {
        const currentStatMixes = currentTier.statMixes;

        for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
          const currentStatMix = currentStatMixes[statMixIndex];

          if (statMix > currentStatMix.statMix) {
            currentStatMixes.splice(statMixIndex, 0, { statMix, armorSets: [armorSet] });
            this.totalSets++;
            inserted = true;
            break outer;
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
              this.totalSets++;
              inserted = true;
              break outer;
            }
          }

          if (statMixIndex === currentStatMixes.length - 1) {
            currentStatMixes.push({ statMix, armorSets: [armorSet] });
            this.totalSets++;
            inserted = true;
            break outer;
          }
        }
      }

      // This is larger than the largest tier we know about, insert it
      if (tierIndex === this.tiers.length - 1) {
        this.tiers.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
        this.totalSets++;
        inserted = true;
        break outer;
      }
    }

    if (!inserted) {
      throw new Error('failed to insert');
    }

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
    this.lowestTier = this.tiers[this.tiers.length - 1].tier;
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
