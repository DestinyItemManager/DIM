/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import {
  LoadoutParameters,
  StatConstraint,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isInsertableArmor2Mod } from 'app/loadout/mod-utils';
import { armorStats } from 'app/search/d2-known-values';
import _ from 'lodash';
import { ArmorStatHashes, MinMaxIgnored, StatFilters } from './types';

export function buildLoadoutParams(
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean,
  lockedMods: PluggableInventoryItemDefinition[],
  searchQuery: string,
  statFilters: Readonly<{ [statType in ArmorStatHashes]: MinMaxIgnored }>,
  statOrder: number[],
  maxStatMods: number,
  exoticArmorHash?: number
): LoadoutParameters {
  const params: LoadoutParameters = {
    statConstraints: _.compact(
      statOrder.map((statHash) => {
        const minMax = statFilters[statHash];
        if (minMax.ignored) {
          return undefined;
        }
        const stat: StatConstraint = {
          statHash,
        };
        if (minMax.min > 0) {
          stat.minTier = minMax.min;
        }
        if (minMax.max < 10) {
          stat.maxTier = minMax.max;
        }
        return stat;
      })
    ),
    lockItemEnergyType,
    upgradeSpendTier,
    maxStatMods,
  };

  if (lockedMods) {
    params.mods = lockedMods.map((mod) => mod.hash);
  }
  if (searchQuery) {
    params.query = searchQuery;
  }
  if (exoticArmorHash) {
    params.exoticArmorHash = exoticArmorHash;
  }

  return params;
}

export function statOrderFromLoadoutParameters(params: LoadoutParameters): ArmorStatHashes[] {
  return _.sortBy(armorStats, (h) => {
    const index = params.statConstraints!.findIndex((c) => c.statHash === h);
    return index >= 0 ? index : 100;
  }) as ArmorStatHashes[];
}

export function statFiltersFromLoadoutParamaters(params: LoadoutParameters): StatFilters {
  const statConstraintsByStatHash = _.keyBy(params.statConstraints, (c) => c.statHash);
  return armorStats.reduce((memo, statHash) => {
    const c = statConstraintsByStatHash[statHash];
    memo[statHash] = c
      ? { min: c.minTier ?? 0, max: c.maxTier ?? 10, ignored: false }
      : { min: 0, max: 10, ignored: true };
    return memo;
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
  }, {} as StatFilters);
}

export function lockedModsFromLoadoutParameters(
  params: LoadoutParameters,
  defs: D2ManifestDefinitions
): PluggableInventoryItemDefinition[] {
  return params.mods
    ? params.mods.map((modHash) => defs.InventoryItem.get(modHash)).filter(isInsertableArmor2Mod)
    : [];
}
