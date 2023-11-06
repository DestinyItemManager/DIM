/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import { StatConstraint, defaultLoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { armorStats } from 'app/search/d2-known-values';
import _ from 'lodash';
import { ResolvedStatConstraint } from './types';

/**
 * Stat constraints are already in priority order, but they do not include
 * ignored stats. This fills in the ignored stats as well, retaining stat order.
 */
export function resolveStatConstraints(
  statConstraints: StatConstraint[],
): ResolvedStatConstraint[] {
  const statConstraintsByStatHash = _.keyBy(statConstraints, (c) => c.statHash);
  const resolvedStatConstraints: ResolvedStatConstraint[] = armorStats.map((statHash) => {
    const c = statConstraintsByStatHash[statHash];
    return { statHash, minTier: c?.minTier ?? 0, maxTier: c?.maxTier ?? 10, ignored: !c };
  });

  return _.sortBy(resolvedStatConstraints, (h) => {
    const index = statConstraints.findIndex((c) => c.statHash === h.statHash);
    return index >= 0
      ? index
      : // Fall back to hardcoded defaults
        100 + defaultLoadoutParameters.statConstraints!.findIndex((c) => c.statHash === h.statHash);
  });
}

export function unresolveStatConstraints(
  resolvedStatConstraints: ResolvedStatConstraint[],
): StatConstraint[] {
  return resolvedStatConstraints
    .filter((c) => !c.ignored)
    .map((c) => {
      const { statHash, minTier, maxTier } = c;
      const constraint: StatConstraint = { statHash };
      if (minTier > 0) {
        constraint.minTier = minTier;
      }
      if (maxTier < 10) {
        constraint.maxTier = maxTier;
      }
      return constraint;
    });
}
