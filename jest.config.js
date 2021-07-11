const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  transform: { '\\.(t|j)s$': ['ts-jest'] },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  verbose: true,
  testTimeout: 60000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '^.+\\.scss$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: ['node_modules/?!(bungie-api-ts)'],
  globals: {
    $BROWSERS: [],
    $DIM_FLAVOR: 'test',
    $DIM_WEB_API_KEY: 'xxx',
    $DIM_API_KEY: 'xxx',
    $featureFlags: {
      dimApi: true,
    },
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
        pathRegex: /\.(spec|test)\.ts$/,
      },
      tsconfig: {
        target: 'ES2015',
        jsx: 'react',
        allowJs: true,
        lib: ['dom', 'esnext'],
      },
    },
  },
};
