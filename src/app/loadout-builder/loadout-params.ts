/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import {
  LoadoutParameters,
  StatConstraint,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Settings } from 'app/settings/initial-settings';
import _ from 'lodash';
import { ArmorStatHashes, MinMaxIgnored } from './types';

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
