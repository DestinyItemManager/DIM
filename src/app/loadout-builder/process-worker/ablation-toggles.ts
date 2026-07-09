/**
 * Ablation toggles for benchmarking individual Loadout Optimizer
 * optimizations. BENCH-BRANCH ONLY — never merge this to master.
 *
 * Each flag disables one optimization when false; all default to true so the
 * worker behaves exactly like production. Consumers read these once at run
 * start into locals, so the hot-loop cost of the instrumentation is a
 * well-predicted branch on a local.
 *
 * Two ways to flip them:
 * - Programmatically (the ablation bench mutates the exported object between
 *   process() calls).
 * - Via env: LO_ABLATE=autoModsMemo,subtreePrune ... sets those flags false at
 *   module load (used to run the parity suite against each ablation).
 */
export const ablation = {
  /** #11868: canPruneSubtree branch-and-bound at all four loop levels. */
  subtreePrune: true,
  /** #11868: seedExactStatRanges up-front exact range seeding. */
  rangeSeeding: true,
  /** #11860: chooseAutoMods memoization (autoModsMemo packed keys). */
  autoModsMemo: true,
  /** #11860: updateMaxStats max-boost memoization (maxBoostMemo). */
  maxBoostMemo: true,
  /** #11860: mayImproveMax convergence gate before updateMaxStats. */
  convergenceGate: true,
  /** #11860: per-set SetEnergyCache shared across the mod solvers. */
  energyCache: true,
  /** #11860: visit high-stat items first so the heap floor rises early. */
  highStatSort: true,
  /** #11860: couldInsert requires strictly beating the worst retained total. */
  strictBeat: true,
  /** #11862: per-set mayMatter gate before the tuning variant loop. */
  tuningPreGate: true,
  /** #11860: outer-level exotic/perk/set-bonus subtree prunes. */
  coarseLevelPrunes: true,
  /** #11860: manually unrolled 6-stat adds (addItemStats/addVectors). */
  unrolledAdds: true,
};

export type AblationFlag = keyof typeof ablation;

export const ablationFlags = Object.keys(ablation) as AblationFlag[];

// Allow disabling flags from the environment so ordinary jest runs (e.g. the
// parity suite) can exercise an ablated configuration without code changes.
// process.env exists under jest/node but not in the browser worker.
declare const process: { env?: { LO_ABLATE?: string } } | undefined;
if (typeof process !== 'undefined' && process.env?.LO_ABLATE) {
  for (const name of process.env.LO_ABLATE.split(',')) {
    const flag = name.trim() as AblationFlag;
    if (flag in ablation) {
      ablation[flag] = false;
    } else if (flag.length) {
      throw new Error(`Unknown LO_ABLATE flag: ${flag}`);
    }
  }
}
