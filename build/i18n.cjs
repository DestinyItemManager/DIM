// Runs i18next-scanner, but only writes src/locale/en.json when the generated
// content actually changes.
//
// Why: the dev server's file watcher reacts to writes, not content. `pnpm start`
// runs watch:i18n in parallel with the dev server, and i18next-scanner rewrites
// en.json on every startup (same bytes, fresh mtime). rspack imports en.json, so
// that no-op write makes it do a spurious recompile right after the initial
// build. That extra compile ships an HMR update a warm browser applies
// mid-first-load, which can fail with "factory is undefined" across split chunks
// until you reload. Scanning into a temp dir and copying only on a real change
// removes that trigger (and incidentally stops needless en.json mtime churn).
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const localeFile = path.join(root, 'src', 'locale', 'en.json');
const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-i18n-'));

try {
  // Resolve the scanner's CLI so this works whether invoked via pnpm or directly.
  let result;
  const env = { ...process.env, I18N_OUTPUT_DIR: tmpOut };
  try {
    const pkg = require('i18next-scanner/package.json');
    const pkgDir = path.dirname(require.resolve('i18next-scanner/package.json'));
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['i18next-scanner'];
    result = spawnSync(
      process.execPath,
      [path.join(pkgDir, binRel), '--config', './i18next-scanner.config.cjs'],
      { stdio: 'inherit', env },
    );
  } catch {
    result = spawnSync('i18next-scanner', ['--config', './i18next-scanner.config.cjs'], {
      stdio: 'inherit',
      shell: true,
      env,
    });
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const generated = path.join(tmpOut, 'src', 'locale', 'en.json');
  const next = fs.readFileSync(generated, 'utf8');
  const current = fs.existsSync(localeFile) ? fs.readFileSync(localeFile, 'utf8') : null;
  if (next !== current) {
    fs.mkdirSync(path.dirname(localeFile), { recursive: true });
    fs.writeFileSync(localeFile, next);
  }
} finally {
  fs.rmSync(tmpOut, { recursive: true, force: true });
}
