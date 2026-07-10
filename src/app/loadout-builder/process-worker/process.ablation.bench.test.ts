/**
 * Ablation benchmark for individual LO optimizations. BENCH BRANCH ONLY.
 *
 * For each (scenario, measurement) pair this interleaves process() with the
 * toggles ON and OFF within each round and reports min-over-rounds for both,
 * so the ratio is immune to this machine's clock drift. All other toggles stay
 * ON, so each number is "what does removing just this optimization cost on
 * top of the current code". A measurement can also be a group of flags
 * toggled off together (e.g. the #11877 removal candidates).
 *
 * NOTE: this measures node's V8 on ts-jest output. The browser harness
 * (pnpm ablation:browser) runs the same matrix on the production bundle in
 * real Chromium/Firefox, which is the number that actually ships; the
 * un-unroll incident proved these can disagree.
 *
 * Run with:
 *   npx jest process.ablation --silent=false
 *
 * Env:
 *   LO_BENCH_PROFILE=path  real profile JSON for the real-vault scenarios
 *                          (falls back to the checked-in test stores)
 *   LO_BENCH_ITEMS=n       per-bucket cap for real-vault scenarios (default 25)
 *   LO_BENCH_ROUNDS=n      rounds per pair (default 5)
 *   LO_BENCH_FLAGS=a,b+c   only run these measurement labels
 *   LO_ABLATE=a,b          handled by ablation-toggles.ts; don't combine with
 *                          this test, which drives the toggles itself
 */
import { noop } from 'es-toolkit';
import { buildSyntheticScenarios, buildVaultScenarios, Scenario } from './ablation-corpus';
import { ablation, AblationFlag, ablationFlags } from './ablation-toggles';
import { process as processArmor, ProcessInputs } from './process';
import { ProcessResult } from './types';

const ROUNDS = Number(process.env.LO_BENCH_ROUNDS) || 5;
const PER_BUCKET = Number(process.env.LO_BENCH_ITEMS) || 25;

// Restrict measurements to specific labels, e.g.
// LO_BENCH_FLAGS=maxBoostMemo+energyCache+convergenceGate+unrolledAdds
const FLAG_FILTER = process.env.LO_BENCH_FLAGS?.split(',');

const clone = (inputs: ProcessInputs): ProcessInputs =>
  JSON.parse(JSON.stringify(inputs)) as ProcessInputs;

async function timeOnce(inputs: ProcessInputs): Promise<[number, ProcessResult]> {
  const inp = clone(inputs);
  const start = performance.now();
  const result = await processArmor(0, inp, noop);
  return [performance.now() - start, result];
}

function fmtCounters(result: ProcessResult): string {
  const s = result.processInfo.statistics.skipReasons;
  return `subtree ${s.subtreePruned} tuningGate ${s.tuningGatePruned} trackerFloor ${s.trackerFloorPruned} lowTier ${s.skippedLowTier} dblExotic ${s.doubleExotic} noExotic ${s.noExotic} perks ${s.insufficientPerks} setBonus ${s.insufficientSetBonus}`;
}

/** A measurement is one flag, or a group of flags toggled off together. */
async function runScenario(scenario: Scenario, measurements: (AblationFlag | AblationFlag[])[]) {
  const { name, inputs } = scenario;
  // Warm both hot-path shapes.
  await timeOnce(inputs);
  const [, allOnResult] = await timeOnce(inputs);
  // eslint-disable-next-line no-console
  console.log(
    `\n=== ${name}: combos ${allOnResult.combos} | valid ${allOnResult.processInfo.numValidSets} | returned ${allOnResult.sets.length}\n    counters: ${fmtCounters(allOnResult)}`,
  );

  for (const measurement of measurements) {
    const group = Array.isArray(measurement) ? measurement : [measurement];
    const label = group.join('+');
    if (FLAG_FILTER && !FLAG_FILTER.includes(label)) {
      continue;
    }
    if (scenario.relevant && !group.every((f) => scenario.relevant!.includes(f))) {
      continue;
    }
    const setGroup = (value: boolean) => {
      for (const f of group) {
        ablation[f] = value;
      }
    };
    const onTimes: number[] = [];
    const offTimes: number[] = [];
    let offResult: ProcessResult | undefined;
    try {
      // Warm the OFF shape too before timing it.
      setGroup(false);
      await timeOnce(inputs);
      setGroup(true);

      for (let round = 0; round < ROUNDS; round++) {
        setGroup(true);
        const [tOn] = await timeOnce(inputs);
        onTimes.push(tOn);
        setGroup(false);
        const [tOff, r] = await timeOnce(inputs);
        offTimes.push(tOff);
        offResult ??= r;
      }
    } finally {
      setGroup(true);
    }

    // strictBeat (admission of ties) and highStatSort (visit order) change
    // which boundary-tied sets are retained, so only the stat ranges are
    // asserted for them; parity covers the retained-set invariants. Everything
    // else must be exactly result-preserving.
    if (offResult) {
      const orderSensitive = group.some((f) => f === 'strictBeat' || f === 'highStatSort');
      if (!orderSensitive) {
        expect(offResult.processInfo.numValidSets).toBe(allOnResult.processInfo.numValidSets);
        expect(offResult.sets.length).toBe(allOnResult.sets.length);
      }
      expect(offResult.statRangesFiltered).toEqual(allOnResult.statRangesFiltered);
    }

    onTimes.sort((a, b) => a - b);
    offTimes.sort((a, b) => a - b);
    const cost = offTimes[0] / onTimes[0];
    // eslint-disable-next-line no-console
    console.log(
      `ABL ${name} | ${label.padEnd(17)} on ${onTimes[0].toFixed(1).padStart(7)}ms  off ${offTimes[0]
        .toFixed(1)
        .padStart(7)}ms  removal costs ${cost.toFixed(2)}x  (on ${onTimes
        .map((t) => t.toFixed(0))
        .join(' ')} | off ${offTimes.map((t) => t.toFixed(0)).join(' ')})`,
    );
  }
}

/** The four removals proposed in #11877, toggled off together. */
const removalCandidates: AblationFlag[] = [
  'maxBoostMemo',
  'energyCache',
  'convergenceGate',
  'unrolledAdds',
];

test('ablation: synthetic scenarios', async () => {
  for (const scenario of await buildSyntheticScenarios()) {
    await runScenario(scenario, [...ablationFlags, removalCandidates]);
  }
}, 600000);

test('ablation: real vault scenarios', async () => {
  const scenarios = await buildVaultScenarios(PER_BUCKET);
  // eslint-disable-next-line no-console
  console.log(
    process.env.LO_BENCH_PROFILE
      ? `real vault from ${process.env.LO_BENCH_PROFILE}`
      : 'checked-in test fixture; set LO_BENCH_PROFILE for a real vault',
  );
  for (const scenario of scenarios) {
    await runScenario(scenario, [...ablationFlags, removalCandidates]);
  }
}, 600000);
