const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  transform: { '\\.(t|j)s$': ['ts-jest'] },
  preset: 'ts-jest',
  verbose: true,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '^.+\\.scss$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js'
  },
  globals: {
    $BROWSERS: [],
    $featureFlags: {
      dimApi: true
    },
    'ts-jest': {
      tsConfig: {
        target: 'ES2015',
        jsx: 'react',
        allowJs: true
      }
    }
  }
};
