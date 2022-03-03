/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import {
  defaultLoadoutParameters,
  LoadoutParameters,
  StatConstraint,
} from '@destinyitemmanager/dim-api-types';
import { armorStats } from 'app/search/d2-known-values';
import _ from 'lodash';
import { ArmorStatHashes, MinMaxIgnored, StatFilters } from './types';

export function buildLoadoutParams(
  loadoutParameters: LoadoutParameters,
  searchQuery: string,
  statFilters: Readonly<{ [statType in ArmorStatHashes]: MinMaxIgnored }>,
  statOrder: number[]
): LoadoutParameters {
  const params: LoadoutParameters = {
    ...loadoutParameters,
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
  };

  if (searchQuery) {
    params.query = searchQuery;
  } else {
    delete params.query;
  }

  return params;
}

export function statOrderFromLoadoutParameters(params: LoadoutParameters): ArmorStatHashes[] {
  return _.sortBy(armorStats, (h) => {
    const index = (params.statConstraints ?? defaultLoadoutParameters.statConstraints!).findIndex(
      (c) => c.statHash === h
    );
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
