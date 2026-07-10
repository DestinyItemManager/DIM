/**
 * Browser ablation bench driver. BENCH BRANCH ONLY.
 *
 * Dumps scenario fixtures (via jest, which has manifest/mapper access), builds
 * the harness page through the production rspack/babel pipeline, serves it,
 * and runs the ablation matrix in real Chromium and Firefox via Playwright.
 *
 *   LO_BENCH_PROFILE=path/to/profile.json node build/browser-ablation.mjs \
 *     [--browsers=chromium,firefox] [--rounds=5] [--flags=a,b+c] \
 *     [--scenarios=vault] [--skip-fixtures] [--skip-build]
 *
 * First run: pnpm add -D playwright && pnpm exec playwright install chromium firefox
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const DIST = path.resolve('dist-ablation');
const FIXTURES = path.join(DIST, 'fixtures');
const browsers = (args.browsers ?? 'chromium,firefox').split(',');
const rounds = args.rounds ?? '5';

const run = (cmd, env = {}) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
};

if (!args['skip-fixtures']) {
  run('pnpm exec jest ablation-fixtures --silent', { LO_BENCH_DUMP: FIXTURES });
} else if (!fs.existsSync(path.join(FIXTURES, 'manifest.json'))) {
  console.error('no fixtures found; run without --skip-fixtures first');
  process.exit(1);
}

if (!args['skip-build']) {
  run('pnpm exec rspack --config ./config/webpack.ablation.ts --node-env=production');
}

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    'content-type': types[path.extname(file)] ?? 'application/octet-stream',
    // Cross-origin isolation unlocks fine-grained performance.now(); without
    // it Firefox clamps timers to 1ms.
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-embedder-policy': 'require-corp',
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log(`\nserving ${DIST} on http://127.0.0.1:${port}`);

const { chromium, firefox } = await import('playwright');
const engines = { chromium, firefox };
const query = new URLSearchParams();
query.set('rounds', rounds);
if (args.flags) {
  query.set('flags', args.flags);
}
if (args.scenarios) {
  query.set('scenarios', args.scenarios);
}

const allResults = {};
for (const name of browsers) {
  const engine = engines[name];
  if (!engine) {
    console.error(`unknown browser ${name}`);
    continue;
  }
  console.log(`\n########## ${name} ##########`);
  const browser = await engine.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`[${name}] pageerror:`, e.message));
  const url = `http://127.0.0.1:${port}/?${query}`;
  await page.goto(url);
  // Stream progress lines as they land in the <pre>.
  let printed = 0;
  const poll = setInterval(async () => {
    try {
      const text = await page.locator('#out').textContent();
      if (text && text.length > printed) {
        process.stdout.write(text.slice(printed));
        printed = text.length;
      }
    } catch {
      /* page busy in a long sync stretch; try again next tick */
    }
  }, 2000);
  const result = await page
    .waitForFunction(() => window.__ABLATION_RESULT, undefined, { timeout: 60 * 60 * 1000 })
    .then((h) => h.jsonValue());
  clearInterval(poll);
  const text = await page.locator('#out').textContent();
  if (text.length > printed) {
    process.stdout.write(text.slice(printed));
  }
  allResults[name] = result;
  await browser.close();
}
server.close();

// Cross-engine summary table
const labels = [
  ...new Set(
    Object.values(allResults).flatMap((r) => r.rows.map((x) => `${x.scenario} | ${x.label}`)),
  ),
];
console.log(`\n===== removal cost by engine (off/on, min over ${rounds} rounds) =====`);
const pad = Math.max(...labels.map((l) => l.length));
console.log(`${'measurement'.padEnd(pad)}  ${browsers.map((b) => b.padStart(18)).join('')}`);
for (const label of labels) {
  const cells = browsers.map((b) => {
    const row = allResults[b]?.rows.find((x) => `${x.scenario} | ${x.label}` === label);
    return row
      ? `${row.cost.toFixed(2)}x (${row.onMs.toFixed(0)}/${row.offMs.toFixed(0)}ms)${row.mismatch ? '!' : ''}`.padStart(
          18,
        )
      : ''.padStart(18);
  });
  console.log(`${label.padEnd(pad)}  ${cells.join('')}`);
}
for (const [name, r] of Object.entries(allResults)) {
  for (const e of r.errors) {
    console.error(`[${name}] ${e}`);
  }
}
