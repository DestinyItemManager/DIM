module.exports = {
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit'],
  verbose: true,
  testTimeout: 60000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '^app/(.*)$': '<rootDir>/src/app/$1',
    '^data/(.*)$': '<rootDir>/src/data/$1',
    '^images/(.*)$': '<rootDir>/src/images/$1',
    '^locale/(.*)$': '<rootDir>/src/locale/$1',
    '^testing/(.*)$': '<rootDir>/src/testing/$1',
    '^docs/(.*)$': '<rootDir>/docs/$1',
    '^.+\\.s?css$': 'identity-obj-proxy',
    'Library\\.mjs$': 'identity-obj-proxy',
  },
  setupFiles: ['./src/testing/jest-setup.js'],
  transformIgnorePatterns: ['node_modules/?!(bungie-api-ts)'],
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
