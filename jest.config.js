const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit'],
  verbose: true,
  testTimeout: 60000,
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    // Automatically include paths from tsconfig
    ...pathsToModuleNameMapper(compilerOptions.paths),
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '^.+\\.s?css$': 'identity-obj-proxy',
    'Library\\.mjs$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/testing/jest-setup.js'],
  // Babel transform is required to handle some es modules?
  transformIgnorePatterns: ['node_modules/(?!bungie-api-ts|@popper|@react-hook)'],
  globals: {
    $BROWSERS: [],
    $DIM_FLAVOR: 'test',
    $DIM_WEB_API_KEY: 'xxx',
    $DIM_API_KEY: 'xxx',
    $DIM_VERSION: '1.0.0',
    $featureFlags: {
      dimApi: true,
    },
  },
};
