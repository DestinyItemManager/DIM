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
import { Settings } from 'app/settings/initial-settings';
import _ from 'lodash';
import { ArmorStatHashes, MinMaxIgnored, StatFilters } from './types';

export function buildLoadoutParams(
  upgradeSpendTier: UpgradeSpendTier,
  lockedMods: PluggableInventoryItemDefinition[],
  searchQuery: string,
  statFilters: Readonly<{ [statType in ArmorStatHashes]: MinMaxIgnored }>,
  statOrder: number[],
  exoticArmorHash?: number
): LoadoutParameters {
  return {
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
    mods: lockedMods.map((mod) => mod.hash),
    query: searchQuery,
    upgradeSpendTier,
    exoticArmorHash,
  };
}

/**
 * Given a Settings object, migrate the old-style toplevel LO settings into the new LoadoutParameters setting.
 */
export function migrateLoadoutParametersFromSettings(settings: Settings): Settings {
  // Only migrate if there aren't already settings
  if (_.isEmpty(settings.loParameters)) {
    return {
      ...settings,
      loParameters: {
        statConstraints: settings.loStatSortOrder.map((statHash) => ({
          statHash,
        })),
        upgradeSpendTier: settings.loUpgradeSpendTier,
        lockItemEnergyType: settings.loLockItemEnergyType,
      },
    };
  }

  return settings;
}

export function statOrderFromLoadoutParameters(params: LoadoutParameters): ArmorStatHashes[] {
  return _.sortBy(armorStats, (h) =>
    params.statConstraints!.findIndex((c) => c.statHash === h)
  ) as ArmorStatHashes[];
}

export function statFiltersFromLoadoutParamaters(params: LoadoutParameters): StatFilters {
  const statConstraintsByStatHash = _.keyBy(params.statConstraints, (c) => c.statHash!);
  return armorStats.reduce((memo, statHash) => {
    const c = statConstraintsByStatHash[statHash];
    memo[statHash] = c
      ? { min: c.minTier ?? 0, max: c.maxTier ?? 10, ignored: false }
      : { min: 0, max: 10, ignored: true };
    return memo;
  }, {}) as StatFilters;
}

export function lockedModsFromLoadoutParameters(
  params: LoadoutParameters,
  defs: D2ManifestDefinitions
): PluggableInventoryItemDefinition[] {
  return params.mods
    ? params.mods.map((modHash) => defs.InventoryItem.get(modHash)).filter(isInsertableArmor2Mod)
    : [];
}
