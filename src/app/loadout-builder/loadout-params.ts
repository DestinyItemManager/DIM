/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { armorStats } from 'app/search/d2-known-values';
import _ from 'lodash';
import { ArmorStatHashes, StatFilters } from './types';

/**
 * Stat constraints are already in priority order, but they do not include
 * ignored stats. This fills in the ignored stats as well and returns a list of
 * armor stat hashes.
 */
export function statOrderFromStatConstraints(statConstraints: StatConstraint[]): ArmorStatHashes[] {
  return _.sortBy(armorStats, (h) => {
    const index = statConstraints.findIndex((c) => c.statHash === h);
    return index >= 0 ? index : 100;
  });
}

export function statFiltersFromStatConstraints(statConstraints: StatConstraint[]): StatFilters {
  const statConstraintsByStatHash = _.keyBy(statConstraints, (c) => c.statHash);
  return armorStats.reduce((memo, statHash) => {
    const c = statConstraintsByStatHash[statHash];
    memo[statHash] = c
      ? { min: c.minTier ?? 0, max: c.maxTier ?? 10, ignored: false }
      : { min: 0, max: 10, ignored: true };
    return memo;
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
  }, {} as StatFilters);
}
