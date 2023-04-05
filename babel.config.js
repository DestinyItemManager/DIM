module.exports = function (api) {
  const isProduction = api.env('production');
  const isTest = api.env('test');
  const plugins = [
    'lodash',
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

  const presetEnvOptions = {
    bugfixes: true,
    modules: false,
    loose: true,
    useBuiltIns: 'usage',
    corejs: 3,
    shippedProposals: true,
  };

  if (isTest) {
    presetEnvOptions.targets = { node: 'current' };
    presetEnvOptions.modules = 'auto';
  }

  return {
    presets: [
      ['@babel/preset-env', presetEnvOptions],
      ['@babel/preset-react', { useBuiltIns: true, loose: true, corejs: 3, runtime: 'automatic' }],
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
