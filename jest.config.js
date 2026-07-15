import { createRequire } from 'module';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json' with { type: 'json' };

// Resolve babel-jest from the project root so it uses @babel/core@8 (the project's
// version) rather than the @babel/core@7 version bundled with jest-config.
const require = createRequire(import.meta.url);

const tsconfigPaths = { ...tsconfig.compilerOptions.paths };
delete tsconfigPaths['*'];

export default {
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit'],
  verbose: true,
  testTimeout: 60000,
  roots: ['<rootDir>'],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  modulePaths: tsconfig.compilerOptions.baseUrl ? [tsconfig.compilerOptions.baseUrl] : [],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)(\\?react)?$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/src/__mocks__/svgMock.mjs',
    '\\.apng$': '<rootDir>/src/__mocks__/svgMock.mjs',
    // Automatically include paths from tsconfig
    ...pathsToModuleNameMapper(tsconfigPaths, { prefix: '<rootDir>/' }),
    '^.+\\.s?css$': 'identity-obj-proxy',
    'Library\\.mjs$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/testing/jest-setup.cjs'],
  // Explicitly resolve babel-jest from the project root to ensure @babel/core@8 is used.
  // Without this, jest-config resolves babel-jest from its own node_modules which uses @babel/core@7.
  transform: {
    '\\.[jt]sx?$': require.resolve('babel-jest'),
    '\\.mjs$': require.resolve('babel-jest'),
  },
  // Babel transform is required to handle some es modules?
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!bungie-api-ts|@destinyitemmanager|@floating-ui|@react-hook|react-router|cookie-es)',
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
