/* Functions for dealing with the LoadoutParameters structure we save with loadouts and use to save and share LO settings. */

import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { MAX_STAT } from 'app/loadout/known-values';
import { armorStats } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { keyBy } from 'es-toolkit';
import { ResolvedStatConstraint } from './types';

/**
 * Stat constraints are already in priority order, but they do not include
 * ignored stats. This fills in the ignored stats as well, retaining stat order.
 */
export function resolveStatConstraints(
  statConstraints: StatConstraint[],
): ResolvedStatConstraint[] {
  const statConstraintsByStatHash = keyBy(statConstraints, (c) => c.statHash);
  const resolvedStatConstraints: ResolvedStatConstraint[] = armorStats.map((statHash) => {
    const c = statConstraintsByStatHash[statHash];
    const minStat = c?.minStat ?? (c?.minTier ?? 0) * 10;
    const maxStat = c?.maxStat ?? (c?.maxTier !== undefined ? c.maxTier * 10 : MAX_STAT);
    return { statHash, minStat, maxStat, ignored: !c };
  });

  return resolvedStatConstraints.sort(
    compareBy((h) => {
      const index = statConstraints.findIndex((c) => c.statHash === h.statHash);
      return index >= 0
        ? index
        : // Fall back to the in-game order
          100 + armorStats.findIndex((c) => c === h.statHash);
    }),
  );
}

export function unresolveStatConstraints(
  resolvedStatConstraints: ResolvedStatConstraint[],
): StatConstraint[] {
  return resolvedStatConstraints
    .filter((c) => !c.ignored)
    .map((c) => {
      const { statHash, minStat, maxStat } = c;
      const constraint: StatConstraint = { statHash };
      if (minStat > 0) {
        constraint.minStat = minStat;
      }
      if (maxStat < MAX_STAT) {
        constraint.maxStat = maxStat;
      }
      return constraint;
    });
}
