import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json' with { type: 'json' };

export default {
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit'],
  verbose: true,
  testTimeout: 60000,
  roots: ['<rootDir>'],
  modulePaths: [tsconfig.compilerOptions.baseUrl],
  moduleNameMapper: {
    '\\.(jpg|jpeg|a?png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)(\\?react)?$':
      '<rootDir>/src/__mocks__/fileMock.js',
    // Automatically include paths from tsconfig
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths),
    '^.+\\.s?css$': 'identity-obj-proxy',
    'Library\\.mjs$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/testing/jest-setup.cjs'],
  // Babel transform is required to handle some es modules?
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!bungie-api-ts|@destinyitemmanager|@popper|@react-hook)',
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
