import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json' with { type: 'json' };

const tsconfigPaths = { ...tsconfig.compilerOptions.paths };
delete tsconfigPaths['*'];

export default {
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit'],
  verbose: true,
  testTimeout: 60000,
  roots: ['<rootDir>'],
  modulePaths: tsconfig.compilerOptions.baseUrl ? [tsconfig.compilerOptions.baseUrl] : [],
  moduleNameMapper: {
    '\\.(jpg|jpeg|a?png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)(\\?react)?$':
      '<rootDir>/src/__mocks__/fileMock.js',
    // Automatically include paths from tsconfig
    ...pathsToModuleNameMapper(tsconfigPaths, { prefix: '<rootDir>/' }),
    '^.+\\.s?css$': 'identity-obj-proxy',
    'Library\\.mjs$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/testing/jest-setup.cjs'],
  // Transform TS/JS(X) with SWC instead of babel-jest. The TS parser is a JS
  // superset, so it also handles the (few) non-ignored node_modules below.
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!bungie-api-ts|@destinyitemmanager|@floating-ui|@react-hook)',
  ],
  globals: {
    $BROWSERS: [],
    $DIM_FLAVOR: 'test',
    $DIM_WEB_API_KEY: 'xxx',
    $DIM_API_KEY: 'xxx',
    $DIM_VERSION: '1.0.0',
    $featureFlags: {
      dimApi: true,
      runLoInBackground: true,
      sentry: false,
    },
  },
};
