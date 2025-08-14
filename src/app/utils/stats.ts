import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import { getArmor3TuningStat, isArtifice } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatsSet } from './stats-set';

/**
 * Compute a set of items that are "stat lower" dupes. These are items for which
 * there exists another item with strictly better stats (i.e. better in at least
 * one stat and not worse in any stat).
 */
export function computeStatDupeLower(
  allItems: DimItem[],
  defs: D2ManifestDefinitions | undefined,
  /** By default, the 6 armor stats. To optimize a custom stat, a subset is passed. */
  relevantArmorStatHashes: number[] = armorStats,
  /**
   * A optional mapping function to get stats and their hashes from an item.
   * Otherwise, grabs hypothetical masterworked stat values for armor stats.
   *
   * This MAY CONTAIN stats that aren't in relevantArmorStatHashes.
   * They'll still be compared as statmixes, but missing from relevantArmorStatHashes means
   * they get ignored during the armor stat adjustment layer.
   *
   * This is used from LO to override the masterwork assumption behavior.
   */
  getArmorStats?: (item: DimItem) => { statHash: number; value: number }[],
) {
  // disregard no-class armor
  const armor = allItems.filter((i) => i.bucket.inArmor && i.classType !== DestinyClass.Classified);

  getArmorStats ??= (item: DimItem) => {
    // Always compare items as if they were fully masterworked
    const masterworkedStatValues = calculateAssumedMasterworkStats(item, {
      assumeArmorMasterwork: AssumeArmorMasterwork.All,
      minItemEnergy: 1,
    });
    return relevantArmorStatHashes.map((statHash) => ({
      statHash,
      value: masterworkedStatValues[statHash] ?? 0,
    }));
  };

  // A mapping from an item to a list of all of its stat configurations (artifice/tunable armor can have multiple).
  // This is just a cache to prevent recalculating it.
  const statsCache = new Map<DimItem, number[][]>();

  for (const item of armor) {
    if (item.stats && item.power) {
      const optimizingStats = getArmorStats(item);
      const statMixes = [optimizingStats.map((s) => s.value)]; // Start with the unadjusted stat mix.

      const tuningStatHash = defs ? getArmor3TuningStat(item, defs) : undefined;
      if (tuningStatHash) {
        // If we can tune to benefit a relevant hash, include tuning mod tradeoff stat mixes.
        if (relevantArmorStatHashes.includes(tuningStatHash)) {
          // For each relevant hash (that isn't the tuned stat),
          // generate a variation where the tuning mod was used to raise the tuned stat, and lower this stat
          for (const loweredStatHash of relevantArmorStatHashes) {
            if (loweredStatHash !== tuningStatHash) {
              statMixes.push(
                optimizingStats.map(({ value, statHash }) =>
                  statHash === tuningStatHash
                    ? value + 5
                    : loweredStatHash === statHash
                      ? value - 5
                      : value,
                ),
              );
            }
          }
        }

        // Stat hashes that would be affected if a Balanced Tuning Mod were applied (those with masterworked value 5 (the base was 0))
        const balancedTuningStatHashes = filterMap(optimizingStats, ({ statHash, value }) =>
          value === 5 ? statHash : undefined,
        );

        // If we can apply Balanced Tuning Mod to benefit a relevant hash, include that stat mix.
        if (relevantArmorStatHashes.some((h) => balancedTuningStatHashes.includes(h))) {
          statMixes.push(
            optimizingStats.map(({ value, statHash }) =>
              balancedTuningStatHashes.includes(statHash) ? value + 1 : value,
            ),
          );
        }
      } else if (isArtifice(item)) {
        // ^ We assume armor cannot be both artifice and tunable.

        // Artifice armor can be +3 in any one stat, so we compute a separate
        // stat mix each with the relevant stat boosted and the others normal.
        for (const relevantStatHash of relevantArmorStatHashes) {
          statMixes.push(
            optimizingStats.map(({ value, statHash }) =>
              relevantStatHash === statHash ? value + 3 : value,
            ),
          );
        }
      }
      statsCache.set(item, statMixes);
    }
  }

  const dupes = new Set<string>();

  // Group by class and armor type. Also, compare exotics with each other, not the general pool.
  const grouped = Object.values(
    Object.groupBy(armor, (i) => `${i.bucket.hash}-${i.classType}-${i.isExotic ? i.hash : ''}`),
  );
  for (const group of grouped) {
    const statSet = new StatsSet<DimItem>();
    // Add a mapping from stats => item to the statsSet for each item in the group
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats) {
        for (const statValues of stats) {
          statSet.insert(statValues, item);
        }
      }
    }

    // Now run through the items in the group again, checking against the fully
    // populated stats set to see if there's something better
    for (const item of group) {
      const stats = statsCache.get(item);
      // All configurations must have a better version somewhere for this to count as statlower
      if (stats?.every((statValues) => statSet.doBetterStatsExist(statValues))) {
        dupes.add(item.id);
      }
    }
  }

  return dupes;
}
