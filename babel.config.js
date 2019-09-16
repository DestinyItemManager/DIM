module.exports = function(api) {
  const isProduction = api.env('production');
  const plugins = [
    'lodash',
    'babel-plugin-idx',
    '@babel/plugin-syntax-dynamic-import',
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: true
      }
    ],
    [
      'transform-imports',
      {
        /*
        '@fortawesome/(free-(brands|solid|regular)-svg-icons)': {
          transform: (member) => `@fortawesome/${1}/${member}`,
          preventFullImport: true
        }
        */
        '@fortawesome/free-brands-svg-icons': {
          transform: (member) => `@fortawesome/free-brands-svg-icons/${member}`,
          preventFullImport: true
        },
        '@fortawesome/free-solid-svg-icons': {
          transform: (member) => `@fortawesome/free-solid-svg-icons/${member}`,
          preventFullImport: true
        },
        '@fortawesome/free-regular-svg-icons': {
          transform: (member) => `@fortawesome/free-regular-svg-icons/${member}`,
          preventFullImport: true
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
    plugins.push('react-hot-loader/babel');
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        {
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
