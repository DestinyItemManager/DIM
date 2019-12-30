const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  transform: { '\\.(t|j)s$': ['ts-jest'] },
  preset: 'ts-jest',
  verbose: true,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  globals: {
    $BROWSERS: [],
    'ts-jest': {
      tsConfig: {
        target: 'ES2015',
        jsx: 'react',
        allowJs: true
      }
    }
  }
};
