import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { armorStats } from 'app/search/d2-known-values';
import _ from 'lodash';
import { ArmorStats } from '../types';
import { statTier } from '../utils';

export function calculateSetStats(
  defs: D2ManifestDefinitions,
  stats: ArmorStats,
  autoStatMods: number[],
  enabledStats: Set<number>
): {
  enabledBaseTier: number;
  totalBaseTier: number;
  statsWithAutoMods: ArmorStats;
  totalTierWithAutoMods: number;
  enabledTierWithAutoMods: number;
} {
  const totalBaseTier = _.sum(Object.values(stats).map(statTier));
  const enabledBaseTier = _.sumBy(armorStats, (statHash) =>
    enabledStats.has(statHash) ? statTier(stats[statHash]) : 0
  );

  const statsWithAutoMods: ArmorStats = { ...stats };
  for (const modHash of autoStatMods) {
    const def = defs.InventoryItem.get(modHash);
    if (def?.investmentStats.length) {
      for (const stat of def.investmentStats) {
        if (statsWithAutoMods[stat.statTypeHash] !== undefined) {
          statsWithAutoMods[stat.statTypeHash] += stat.value;
        }
      }
    }
  }
  const totalTierWithAutoMods = _.sum(Object.values(statsWithAutoMods).map(statTier));
  const enabledTierWithAutoMods = _.sumBy(armorStats, (statHash) =>
    enabledStats.has(statHash) ? statTier(statsWithAutoMods[statHash]) : 0
  );

  return {
    enabledBaseTier,
    totalBaseTier,
    statsWithAutoMods,
    totalTierWithAutoMods,
    enabledTierWithAutoMods,
  };
}
