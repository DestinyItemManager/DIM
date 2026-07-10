/**
 * Browser ablation harness page. BENCH BRANCH ONLY.
 *
 * Loads the scenario fixtures dumped by ablation-fixtures.test.ts, runs the
 * ablation matrix in a real Web Worker (production-bundled process()), and
 * exposes results for the Playwright driver in window.__ABLATION_RESULT.
 *
 * Query params:
 *   ?rounds=5            rounds per measurement
 *   ?flags=a,b+c         only these measurement labels (groups joined with +)
 *   ?scenarios=vault     only scenarios whose name includes this substring
 */
import {
  AblationFlag,
  ablationFlags,
} from '../app/loadout-builder/process-worker/ablation-toggles';
import type { ProcessInputs } from '../app/loadout-builder/process-worker/process';
import type { AblationRow, RunMessage } from './worker';

declare global {
  interface Window {
    __ABLATION_RESULT?: { rows: AblationRow[]; errors: string[] };
  }
}

/** The removals proposed in #11877, toggled off together. */
const removalCandidates: AblationFlag[] = [
  'maxBoostMemo',
  'energyCache',
  'convergenceGate',
  'unrolledAdds',
];

const out = document.getElementById('out')!;
const println = (text: string) => {
  out.textContent += `${text}\n`;
};

interface ManifestScenario {
  name: string;
  relevant?: AblationFlag[];
  file: string;
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const rounds = Number(params.get('rounds')) || 5;
  const flagFilter = params.get('flags')?.split(',');
  const scenarioFilter = params.get('scenarios');

  const manifest = (await (await fetch('fixtures/manifest.json')).json()) as {
    generated: string;
    scenarios: ManifestScenario[];
  };
  println(`fixtures generated ${manifest.generated} | rounds ${rounds} | ${navigator.userAgent}`);

  const allMeasurements: AblationFlag[][] = [...ablationFlags.map((f) => [f]), removalCandidates];
  const worker = new Worker(
    /* webpackChunkName: "ablation-worker" */ new URL('./worker', import.meta.url),
  );

  const rows: AblationRow[] = [];
  const errors: string[] = [];
  for (const scenario of manifest.scenarios) {
    if (scenarioFilter && !scenario.name.includes(scenarioFilter)) {
      continue;
    }
    const measurements = allMeasurements.filter((group) => {
      const label = group.join('+');
      if (flagFilter && !flagFilter.includes(label)) {
        return false;
      }
      return !scenario.relevant || group.every((f) => scenario.relevant!.includes(f));
    });
    if (!measurements.length) {
      continue;
    }
    const inputs = (await (await fetch(`fixtures/${scenario.file}`)).json()) as ProcessInputs;

    await new Promise<void>((resolve) => {
      worker.onmessage = (
        e: MessageEvent<{ type: string; text?: string; rows?: AblationRow[]; error?: string }>,
      ) => {
        if (e.data.type === 'line') {
          println(e.data.text!);
        } else if (e.data.type === 'done') {
          rows.push(...e.data.rows!);
          resolve();
        } else if (e.data.type === 'error') {
          println(`ERROR in ${scenario.name}: ${e.data.error}`);
          errors.push(`${scenario.name}: ${e.data.error}`);
          resolve();
        }
      };
      const msg: RunMessage = { type: 'run', name: scenario.name, inputs, measurements, rounds };
      worker.postMessage(msg);
    });
  }

  println('ALL DONE');
  window.__ABLATION_RESULT = { rows, errors };
  document.title = 'ablation done';
}

main().catch((e: Error) => {
  println(`FATAL: ${e.message}`);
  window.__ABLATION_RESULT = { rows: [], errors: [`fatal: ${e.message}`] };
  document.title = 'ablation done';
});
