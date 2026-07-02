import { defineConfig } from '@rstest/core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cssStub = require.resolve('identity-obj-proxy');

// Rstest (rspack-native test runner) config, mirroring jest.config.js.
export default defineConfig({
  testEnvironment: 'jsdom',
  globals: true,
  setupFiles: ['./src/testing/rstest-setup.ts'],
  include: ['src/**/*.test.{ts,tsx}'],
  // Note: precache-manifest.test.ts (which seeds the manifest cache) is excluded
  // from the parallel run via the CLI flag in the `test:rstest` script, not here,
  // so it can still be run on its own as the seeding step.
  exclude: ['**/node_modules/**'],
  testTimeout: 60000,
  tools: {
    // DIM uses the automatic JSX runtime; without this rstest's SWC defaults to
    // classic (React.createElement) and runtime JSX throws "React is not defined".
    swc: {
      jsc: { transform: { react: { runtime: 'automatic' } } },
    },
    // Stub scss/css imports (transitively pulled in via components) to
    // identity-obj-proxy, exactly like jest's moduleNameMapper did.
    rspack: (_config, { appendPlugins, rspack }) => {
      appendPlugins(new rspack.NormalModuleReplacementPlugin(/\.s?css$/, cssStub));
    },
  },
  source: {
    // Mirror jest.config.js `globals`. Scalars are safe to inline via define, but
    // $featureFlags must NOT be inlined as an object literal: at statement-start
    // position `{...}.foo` parses as a block, not an object. The webpack build
    // sidesteps this by defining each `$featureFlags.KEY` individually; jest sets
    // it as a runtime global. We do the latter in rstest-setup.ts.
    define: {
      $BROWSERS: JSON.stringify([]),
      $DIM_FLAVOR: JSON.stringify('test'),
      $DIM_WEB_API_KEY: JSON.stringify('xxx'),
      $DIM_API_KEY: JSON.stringify('xxx'),
      $DIM_VERSION: JSON.stringify('1.0.0'),
    },
  },
});
