/**
 * Dumps the ablation scenario inputs as JSON fixtures for the browser harness.
 * BENCH BRANCH ONLY. Not a test; jest is just the easiest runtime with access
 * to the manifest fixtures and mappers. Only runs when LO_BENCH_DUMP is set:
 *
 *   LO_BENCH_DUMP=dist-ablation/fixtures LO_BENCH_PROFILE=... npx jest ablation-fixtures
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildSyntheticScenarios, buildVaultScenarios } from './ablation-corpus';

const DUMP_DIR = process.env.LO_BENCH_DUMP;
const PER_BUCKET = Number(process.env.LO_BENCH_ITEMS) || 25;

(DUMP_DIR ? test : test.skip)(
  'dump ablation fixtures',
  async () => {
    const scenarios = [
      ...(await buildSyntheticScenarios()),
      ...(await buildVaultScenarios(PER_BUCKET)),
    ];
    fs.mkdirSync(DUMP_DIR!, { recursive: true });
    const manifest = scenarios.map((scenario, i) => {
      const file = `scenario-${i}.json`;
      fs.writeFileSync(path.join(DUMP_DIR!, file), JSON.stringify(scenario.inputs));
      return { name: scenario.name, relevant: scenario.relevant, file };
    });
    fs.writeFileSync(
      path.join(DUMP_DIR!, 'manifest.json'),
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          profile: process.env.LO_BENCH_PROFILE,
          scenarios: manifest,
        },
        null,
        2,
      ),
    );
    // eslint-disable-next-line no-console
    console.log(`wrote ${scenarios.length} scenarios to ${DUMP_DIR}`);
  },
  300000,
);
