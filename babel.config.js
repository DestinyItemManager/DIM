module.exports = function(api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const plugins = [
    'lodash',
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
        '@fortawesome/free-(\\w+)-svg-icons': {
          transform: '@fortawesome/free-${1}-svg-icons/${member}',
          skipDefaultConversion: true,
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
