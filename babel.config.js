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
