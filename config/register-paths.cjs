// Register TypeScript path mappings for Node.js
// This allows the webpack config to import files that use path aliases like 'app/*'
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('../tsconfig.json');

tsConfigPaths.register({
  baseUrl: tsConfig.compilerOptions.baseUrl || '.',
  paths: tsConfig.compilerOptions.paths,
});
