import { DesiredStatRange, ResolvedStatConstraint } from 'app/loadout-builder/types';

/**
 * Loadout Analysis (and the corresponding LO mode) sometimes are interested in
 * strictly better stats/tiers. This takes (assumed) loadout stats and the
 * user-selected stat constraints and merges them so that a set satisfying the
 * merged constraints always satisfies both the input constraint sets.
 *
 * Returns `mergedConstraintsImplyStrictUpgrade` iff every valid set in the
 * merged constraints is also always a strict upgrade, so that we don't have to
 * ask the process worker for strict upgrades on top of that.
 *
 * This also maps the stat constraints into the DesiredStatRange format, which
 * folds the "ignored" bit into the maxTier by setting it to 0.
 */
export function mergeStrictUpgradeStatConstraints(
  existingLoadoutStatsAsStatConstraints: ResolvedStatConstraint[] | undefined,
  parameterStatConstraints: ResolvedStatConstraint[],
): {
  mergedDesiredStatRanges: DesiredStatRange[];
  mergedConstraintsImplyStrictUpgrade: boolean;
} {
  // If a user-selected stat ends up higher than the corresponding existing loadout stat,
  // then every valid process set already is a strict upgrade (since effective stat constraints
  // are always >= existing constraints and there's one constraint that's higher than
  // the existing stat, satisfying the definition of "strict upgrade").
  let mergedConstraintsImplyStrictUpgrade = false;
  const mergedDesiredStatRanges = parameterStatConstraints.map((constraint) => {
    const existingStatConstraint = existingLoadoutStatsAsStatConstraints?.find(
      (c) => c.statHash === constraint.statHash,
    );
    const minStat = constraint.ignored ? 0 : constraint.minStat;
    const maxStat = constraint.ignored ? 0 : constraint.maxStat;
    if (existingStatConstraint && !constraint.ignored) {
      const existingMinStat = existingStatConstraint.ignored ? 0 : existingStatConstraint.minStat;
      const effectiveMinStat = Math.min(maxStat, existingMinStat);
      mergedConstraintsImplyStrictUpgrade ||= minStat > effectiveMinStat;
      return {
        statHash: constraint.statHash,
        minStat: Math.max(minStat, effectiveMinStat),
        maxStat,
      };
    }
    return {
      statHash: constraint.statHash,
      minStat,
      maxStat,
    };
  });
  return { mergedDesiredStatRanges, mergedConstraintsImplyStrictUpgrade };
}
