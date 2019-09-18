const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  verbose: true,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  globals: {
    'ts-jest': {
      tsConfig: {
        jsx: 'react'
      }
    }
  }
};
