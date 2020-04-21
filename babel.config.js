module.exports = function(api) {
  const isProduction = api.env('production');
  const plugins = [
    'lodash',
    'babel-plugin-optimize-clsx',
    '@babel/plugin-syntax-dynamic-import',
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: true
      }
    ],
    [
      'transform-imports',
      {
        '@fortawesome/free-brands-svg-icons': {
          transform: (member) => `@fortawesome/free-brands-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true
        },
        '@fortawesome/free-solid-svg-icons': {
          transform: (member) => `@fortawesome/free-solid-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true
        },
        '@fortawesome/free-regular-svg-icons': {
          transform: (member) => `@fortawesome/free-regular-svg-icons/${member}`,
          preventFullImport: true,
          skipDefaultConversion: true
        }
      }
    ]
  ];

  if (isProduction) {
    plugins.push(
      '@babel/plugin-transform-react-constant-elements',
      '@babel/plugin-transform-react-inline-elements'
    );
  } else {
    // In dev, compile TS with babel
    plugins.push(
      'react-hot-loader/babel',
      '@babel/proposal-class-properties',
      '@babel/proposal-object-rest-spread',
      [
        'const-enum',
        {
          transform: 'constObject'
        }
      ],
      ['@babel/plugin-transform-typescript', { isTSX: true }]
    );
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          modules: false,
          loose: true,
          useBuiltIns: 'usage',
          corejs: 3,
          shippedProposals: true
        }
      ],
      ['@babel/preset-react', { useBuiltIns: true, loose: true, corejs: 3 }]
    ],
    plugins
  };
};
