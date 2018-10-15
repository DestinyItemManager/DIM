module.exports = function(api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const plugins = [
    'lodash',
    'angularjs-annotate',
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
          useBuiltIns: 'entry',
          shippedProposals: true
        }
      ],
      ['@babel/preset-react', { useBuiltIns: true, loose: true }]
    ],
    plugins
  };
};
