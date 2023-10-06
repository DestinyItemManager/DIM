const coreJSPackage = require('core-js/package.json');

module.exports = function (api) {
  const isProduction = api.env('production');
  const isTest = api.env('test');
  const plugins = [
    '@sigmacomputing/babel-plugin-lodash',
    'babel-plugin-optimize-clsx',
    'object-to-json-parse',
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: !isTest,
      },
    ],
    [
      'transform-imports',
      {
        '@fortawesome/free-brands-svg-icons': {
          transform: (member) => `@fortawesome/free-brands-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true,
        },
        '@fortawesome/free-solid-svg-icons': {
          transform: (member) => `@fortawesome/free-solid-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true,
        },
        '@fortawesome/free-regular-svg-icons': {
          transform: (member) => `@fortawesome/free-regular-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true,
        },
      },
    ],
  ];

  if (isProduction) {
    plugins.push(
      '@babel/plugin-transform-react-constant-elements',
      '@babel/plugin-transform-react-inline-elements'
    );
  } else {
    if (!isTest) {
      plugins.push('react-refresh/babel');
    }

    // In dev, compile TS with babel
    plugins.push(['@babel/plugin-transform-typescript', { isTSX: true, optimizeConstEnums: true }]);
  }

  const corejs = { version: coreJSPackage.version };

  const presetEnvOptions = {
    bugfixes: true,
    modules: false,
    loose: true,
    useBuiltIns: 'usage',
    corejs,
    shippedProposals: true,
    // Set to true and run `npm run build:beta` to see what plugins and polyfills are being used
    debug: false,
    // corejs includes a bunch of polyfills for behavior we don't use or bugs we don't care about
    exclude: [
      // Really edge-case bugfix for Array.prototype.push and friends
      'es.array.push',
      'es.array.unshift',
      // Remove this if we start using proposed set methods like .intersection
      /esnext\.set/,
      // Remove this if we start using iterator-helpers (which would be nice!)
      /esnext\.iterator/,
      // Not sure what exactly this is, but we have our own error-cause stuff
      'es.error.cause',
      // Only used when customizing JSON parsing w/ a "reviver"
      'esnext.json.parse',
      // Edge-case bugfixes for URLSearchParams.prototype.has, delete, and size
      /web\.url-search-params/,
      // Mis-detected array grouping proposal
      'esnext.array.group',
      // Unneeded mis-detected DOMException extension
      'web.dom-exception.stack',
      // Not needed in worker context
      'web.self',
      // Mis-detected by usage of Array.prototype.at
      'es.string.at-alternative',
    ],
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
          useBuiltIns: true,
          loose: true,
          corejs,
          runtime: 'automatic',
          useSpread: true,
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
