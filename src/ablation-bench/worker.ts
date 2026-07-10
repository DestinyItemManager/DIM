/**
 * Browser-side ablation runner. BENCH BRANCH ONLY.
 *
 * Runs the same interleaved toggle matrix as process.ablation.bench.test.ts,
 * but inside a real Web Worker on the production-bundled code, which is what
 * actually ships. Driven by src/ablation-bench/main.ts.
 */
import { ablation, AblationFlag } from '../app/loadout-builder/process-worker/ablation-toggles';
import {
  process as processArmor,
  ProcessInputs,
} from '../app/loadout-builder/process-worker/process';
import { ProcessResult } from '../app/loadout-builder/process-worker/types';

export interface RunMessage {
  type: 'run';
  name: string;
  inputs: ProcessInputs;
  /** Each measurement is a group of flags toggled off together. */
  measurements: AblationFlag[][];
  rounds: number;
}

export interface AblationRow {
  scenario: string;
  label: string;
  onMs: number;
  offMs: number;
  cost: number;
  onAll: number[];
  offAll: number[];
  mismatch?: string;
}

const post = (msg: unknown) => (globalThis as unknown as Worker).postMessage(msg);
const log = (text: string) => post({ type: 'line', text });

async function timeOnce(inputs: ProcessInputs): Promise<[number, ProcessResult]> {
  const inp = structuredClone(inputs);
  const start = performance.now();
  const result = await processArmor(0, inp, () => {
    /* progress unused */
  });
  return [performance.now() - start, result];
}

function fmtCounters(result: ProcessResult): string {
  const s = result.processInfo.statistics.skipReasons;
  return `subtree ${s.subtreePruned} tuningGate ${s.tuningGatePruned} trackerFloor ${s.trackerFloorPruned} lowTier ${s.skippedLowTier} dblExotic ${s.doubleExotic} noExotic ${s.noExotic} perks ${s.insufficientPerks} setBonus ${s.insufficientSetBonus}`;
}

async function runScenario({ name, inputs, measurements, rounds }: RunMessage) {
  const rows: AblationRow[] = [];
  // Warm the JIT before anything is timed.
  await timeOnce(inputs);
  const [, allOnResult] = await timeOnce(inputs);
  log(
    `=== ${name}: combos ${allOnResult.combos} | valid ${allOnResult.processInfo.numValidSets} | returned ${allOnResult.sets.length}`,
  );
  log(`    counters: ${fmtCounters(allOnResult)}`);

  for (const group of measurements) {
    const label = group.join('+');
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

      for (let round = 0; round < rounds; round++) {
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

    // Same result-preservation checks as the jest runner, reported instead of
    // thrown so one bad toggle doesn't kill the whole matrix.
    let mismatch: string | undefined;
    if (offResult) {
      const orderSensitive = group.some((f) => f === 'strictBeat' || f === 'highStatSort');
      if (
        !orderSensitive &&
        (offResult.processInfo.numValidSets !== allOnResult.processInfo.numValidSets ||
          offResult.sets.length !== allOnResult.sets.length)
      ) {
        mismatch = `valid/returned ${offResult.processInfo.numValidSets}/${offResult.sets.length} vs ${allOnResult.processInfo.numValidSets}/${allOnResult.sets.length}`;
      } else if (
        JSON.stringify(offResult.statRangesFiltered) !==
        JSON.stringify(allOnResult.statRangesFiltered)
      ) {
        mismatch = 'statRangesFiltered differ';
      }
    }

    onTimes.sort((a, b) => a - b);
    offTimes.sort((a, b) => a - b);
    const row: AblationRow = {
      scenario: name,
      label,
      onMs: onTimes[0],
      offMs: offTimes[0],
      cost: offTimes[0] / onTimes[0],
      onAll: onTimes,
      offAll: offTimes,
      mismatch,
    };
    rows.push(row);
    log(
      `ABL ${name} | ${label.padEnd(17)} on ${onTimes[0].toFixed(1).padStart(7)}ms  off ${offTimes[0]
        .toFixed(1)
        .padStart(
          7,
        )}ms  removal costs ${row.cost.toFixed(2)}x${mismatch ? `  RESULT MISMATCH: ${mismatch}` : ''}`,
    );
  }
  post({ type: 'done', rows });
}

globalThis.onmessage = (e: MessageEvent<RunMessage>) => {
  if (e.data.type === 'run') {
    runScenario(e.data).catch((err: Error) =>
      post({ type: 'error', error: `${err.name}: ${err.message}\n${err.stack}` }),
    );
  }
};
