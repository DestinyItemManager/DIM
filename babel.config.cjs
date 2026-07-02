const coreJSPackage = require('core-js/package.json');

module.exports = function (api) {
  const isProduction = api.env('production');
  const isTest = api.env('test');
  const plugins = [
    // Statically optimize away clsx functions
    'babel-plugin-optimize-clsx',
    // Improve performance by turning large objects into JSON.parse
    'object-to-json-parse',
    // moduleName overrides what babel-plugin-polyfill-corejs3 sets via runtimeHelpersModuleName
    ['@babel/plugin-transform-runtime', { moduleName: '@babel/runtime' }],
    // Replaces @babel/preset-env's useBuiltIns: 'usage' (removed in Babel 8)
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'usage-global',
        version: coreJSPackage.version,
        proposals: true,
        // corejs includes a bunch of polyfills for behavior we don't use or bugs we don't care about
        exclude: [
          // Really edge-case bugfix for Array.prototype.push and friends
          'es.array.push',
          'es.array.unshift',
          // This fixes an obscure Webkit bug that we don't care about
          'es.map.group-by',
          // Remove this if we start using proposed set methods like .intersection
          /^es(next)?\.set/,
          // Remove this if we start using iterator-helpers (which would be nice!)
          /^es(next)?\.iterator\.(?!concat)/,
          // Not sure what exactly this is, but we have our own error-cause stuff
          'es.error.cause',
          // Only used when customizing JSON parsing w/ a "reviver"
          'esnext.json.parse',
          // Edge-case bugfixes for URLSearchParams.prototype.has, delete, and size
          /^web\.url-search-params/,
          // Unneeded mis-detected DOMException extension
          'web.dom-exception.stack',
          // Not needed in worker context
          'web.self',
          // Mis-detected by usage of Array.prototype.at
          'es.string.at-alternative',
          // We're not doing weird stuff with structured clone
          'web.structured-clone',
        ],
      },
    ],
  ];

  if (isProduction) {
    plugins.push(
      // Optimize React components at the cost of some memory by automatically
      // factoring out constant/inline JSX fragments
      '@babel/plugin-transform-react-constant-elements',
      // This transform is not compatible with React 19
      // '@babel/plugin-transform-react-inline-elements',
    );
  } else {
    if (!isTest) {
      plugins.push('react-refresh/babel');
    }

    // In dev, compile TS with babel
    plugins.push(['@babel/plugin-transform-typescript', { isTSX: true, optimizeConstEnums: true }]);
  }

  const presetEnvOptions = {
    modules: false,
    shippedProposals: true,
    // Set to true and run `pnpm build:beta` to see what plugins and polyfills are being used
    debug: false,
  };

  if (isTest) {
    presetEnvOptions.targets = { node: 'current' };
    presetEnvOptions.modules = 'auto';
  }

  return {
    presets: [
      ['@babel/preset-env', presetEnvOptions],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
    ],
    plugins,
    // https://babeljs.io/docs/en/assumptions
    assumptions: {
      noDocumentAll: true,
      noClassCalls: true,
      setPublicClassFields: true,
      setSpreadProperties: true,
    },
  };
};
